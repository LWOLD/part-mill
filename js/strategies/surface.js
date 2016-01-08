"use strict";

class SurfaceStrategy extends Strategy {

  pause() {
    subModel = null;
  }
  unpause() {
    this.calculateSubModel(toolPos[1]);
  }

  calculateSubModel(yPos) {
    // Slice the model up so we only have to do collision detection with parts that are on the current Y layer.
    var subBox = CSG.box({bbox: [
      [this.boundingBox[0][0], yPos - toolDiameter/2, this.boundingBox[0][2]],
      [this.boundingBox[1][0], yPos + toolDiameter/2, this.boundingBox[1][2]],
    ]});
    subModel = model.intersect(subBox);
  }

  stepTool() {
    if (this.calculatingStep) {
      return;
    }

    this.calculatingStep = true;
    var pos = toolPos;

    // Start from the bottom of the boundingBox
    pos[2] = this.boundingBox[0][2];

    if ((toolDirectionX == 1 &&
          pos[0] + ((resolution + (toolDiameter/2)) * toolDirectionX) <= boundingBox[1][0]) ||
        (toolDirectionX == -1 &&
          pos[0] + ((resolution + (toolDiameter/2)) * toolDirectionX) >= boundingBox[0][0])
        ) {
      // Continue moving in the same direction left or right
      pos[0] += resolution * toolDirectionX;
    }
    else if ((toolDirectionY == 1 &&
               pos[1] + ((resolution + (toolDiameter/2)) * toolDirectionY) <= boundingBox[1][1]) ||
             (toolDirectionY == -1 &&
               pos[1] + ((resolution + (toolDiameter/2)) * toolDirectionY) >= boundingBox[0][1])
             ) {
      // Move tool away from us and change X direction
      pos[1] += resolution * toolDirectionY;
      this.calculateSubModel(pos[1]);
      toolDirectionX = toolDirectionX * -1;
    }
    else {
      // Completed path as got to the bottom of the bounding boundingBox
      return 'COMPLETE';
    }

    tool = CSG.cylinder({ radius: toolDiameter/2, slices: 8, start: pos, end: [pos[0], pos[1], pos[2]+boundingBoxDimensions[2]] });
    var zpos = pos[2];
    if (this.hasCollided()) {
      // We have the mesh left over from the intersection of the sub model and tool so we can just pick the highest vertex from that.
      for (var vertex of this.collisionMesh.vertices) {
        if (vertex[2] > zpos) {
          zpos = vertex[2];
          tool = CSG.cylinder({ radius: toolDiameter/2, slices: 8, start: [pos[0], pos[1], zpos], end: [pos[0], pos[1], zpos+boundingBoxDimensions[2]] });
          tool.setColor(1, 0, 0);
          toolPos = pos;
        }
      }
    }

    toolPos = pos;
    this.optimisePath([pos[0], pos[1], zpos]);
    toolPath.push([pos[0], pos[1], zpos]);
    rebuild();
    this.calculatingStep = false;
  }
};
