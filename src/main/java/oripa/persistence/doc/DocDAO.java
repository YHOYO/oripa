package oripa.persistence.doc;

import oripa.doc.Doc;
import oripa.persistence.dao.AbstractFileDAO;
import oripa.persistence.dao.AbstractFilterSelector;
import oripa.persistence.filetool.FileTypeProperty;

/**
 *
 * load and save {@link oripa.doc.Doc} to/from file
 *
 * @author OUCHI Koji
 *
 *
 */
public class DocDAO extends AbstractFileDAO<Doc> {
	private final AbstractFilterSelector<Doc> selector;

	/**
	 * Constructor
	 *
	 * @param selector
	 *            If you don't use {@link #load(String)} and
	 *            {@link AbstractFileDAO#save(Doc, String, FileTypeProperty)},
	 *            {@code selector} can be null.
	 */
	public DocDAO(final AbstractFilterSelector<Doc> selector) {
		this.selector = selector;
	}

	/* (non Javadoc)
	 * @see oripa.persistent.dao.AbstractDAO#getFilterSelector()
	 */
	@Override
	protected AbstractFilterSelector<Doc> getFilterSelector() {
		return selector;
	}
}
