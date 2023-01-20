package oripa.domain.cutmodel;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.vecmath.Vector2d;

import oripa.domain.fold.halfedge.OriFace;
import oripa.domain.fold.halfedge.OrigamiModel;
import oripa.geom.GeomUtil;
import oripa.util.MathUtil;
import oripa.value.OriLine;

public class CutModelOutlinesFactory {

	/**
	 * creates outline of cut origami model
	 *
	 * @param scissorsLine
	 * @param origamiModel
	 * @return
	 */
	public Collection<OriLine> createOutlines(
			final OriLine scissorsLine, final OrigamiModel origamiModel, final double pointEps) {

		Collection<OriLine> cutLines = new ArrayList<>();

		List<OriFace> faces = origamiModel.getFaces();

		for (OriFace face : faces) {
			List<Vector2d> vv = findOutlineEdgeTerminals(scissorsLine, face, pointEps);

			if (vv.size() >= 2) {
				cutLines.add(new OriLine(vv.get(0), vv.get(1), OriLine.Type.CUT_MODEL));
			}
		}

		return cutLines;
	}

	private List<Vector2d> findOutlineEdgeTerminals(final OriLine cutLine, final OriFace face, final double pointEps) {
		List<Vector2d> vv = new ArrayList<>(2);

		face.halfedgeStream().forEach(he -> {
			var position = he.getPositionForDisplay();
			var nextPosition = he.getNext().getPositionForDisplay();
			OriLine l = new OriLine(position.x, position.y,
					nextPosition.x, nextPosition.y, OriLine.Type.AUX);

			double params[] = new double[2];
			boolean res = getCrossPointParam(cutLine.p0, cutLine.p1, l.p0, l.p1, params);
			if (res == true &&
					params[0] > -0.001 && params[1] > -0.001 &&
					params[0] < 1.001 && params[1] < 1.001) {
				double param = params[1];

				Vector2d crossV = new Vector2d();
				var positionBefore = he.getPositionBeforeFolding();
				var nextPositionBefore = he.getNext().getPositionBeforeFolding();
				crossV.x = (1.0 - param) * positionBefore.x + param * nextPositionBefore.x;
				crossV.y = (1.0 - param) * positionBefore.y + param * nextPositionBefore.y;

				boolean isNewPoint = true;
				for (Vector2d v2d : vv) {
					if (GeomUtil.distance(v2d, crossV) < pointEps) {
						isNewPoint = false;
						break;
					}
				}
				if (isNewPoint) {
					vv.add(crossV);
				}
			}
		});

		return vv;
	}

//  Obtain the parameters for the intersection of the segments p0-p1 and q0-q1
//  The param stores the position of the intersection
//  Returns false if parallel
	private boolean getCrossPointParam(final Vector2d p0, final Vector2d p1, final Vector2d q0,
			final Vector2d q1, final double[] param) {

		Vector2d d0 = new Vector2d(p1.x - p0.x, p1.y - p0.y);
		Vector2d d1 = new Vector2d(q1.x - q0.x, q1.y - q0.y);
		Vector2d diff = new Vector2d(q0.x - p0.x, q0.y - p0.y);
		double det = d1.x * d0.y - d1.y * d0.x;

		if (det * det > MathUtil.normalizedValueEps() * d0.lengthSquared() * d1.lengthSquared()) {
			// Lines intersect in a single point. Return both s and t values for
			// use by calling functions.
			double invDet = 1.0 / det;

			param[0] = (d1.x * diff.y - d1.y * diff.x) * invDet;
			param[1] = (d0.x * diff.y - d0.y * diff.x) * invDet;
			return true;
		}
		return false;

	}

}
