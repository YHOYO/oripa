package oripa.gui.presenter.creasepattern;

import oripa.domain.paint.PaintContextInterface;
import oripa.domain.paint.line.SelectingFirstVertexForLine;

public class TwoPointLineAction extends TwoPointSegmentAction {

	public TwoPointLineAction() {
		setActionState(new SelectingFirstVertexForLine());
	}

	@Override
	public void destroy(final PaintContextInterface context) {
		super.destroy(context);
	}

	@Override
	protected void recoverImpl(final PaintContextInterface context) {
		context.clear(true);
		setActionState(new SelectingFirstVertexForLine());

	}

}
