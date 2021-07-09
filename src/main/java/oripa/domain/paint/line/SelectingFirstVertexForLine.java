package oripa.domain.paint.line;

import oripa.domain.paint.PaintContextInterface;
import oripa.domain.paint.core.PickingVertex;

public class SelectingFirstVertexForLine extends PickingVertex {

	public SelectingFirstVertexForLine() {
		super();
	}

	@Override
	public void undoAction(final PaintContextInterface context) {
		context.clear(false);
	}

	@Override
	public void onResult(final PaintContextInterface context, final boolean doSpecial) {

	}

	@Override
	protected void initialize() {
		setPreviousClass(this.getClass());
		setNextClass(SelectingSecondVertexForLine.class);
	}

}
