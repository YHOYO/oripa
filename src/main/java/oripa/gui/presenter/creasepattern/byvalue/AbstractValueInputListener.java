package oripa.gui.presenter.creasepattern.byvalue;

import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.text.Document;

import oripa.domain.paint.byvalue.ValueSetting;

/**
 * A template for catching input from text input. Use as:
 * text.getDocument().addDocumentListener(new SubclassOfThis());
 *
 * @author koji
 *
 */
public abstract class AbstractValueInputListener implements DocumentListener {

	private final ValueSetting valueSetting;

	/**
	 * Constructor
	 */
	public AbstractValueInputListener(final ValueSetting valueSetting) {
		this.valueSetting = valueSetting;
	}

	@Override
	public void insertUpdate(final DocumentEvent e) {
		setToValueSetting(e);

	}

	@Override
	public void removeUpdate(final DocumentEvent e) {
		setToValueSetting(e);

	}

	@Override
	public void changedUpdate(final DocumentEvent e) {
		setToValueSetting(e);
	}

	private void setToValueSetting(final DocumentEvent e) {
		Document document = e.getDocument();
		try {
			String text = document.getText(0, document.getLength());
			double length = java.lang.Double.valueOf(text);

			setValue(length, valueSetting);
		} catch (Exception ex) {

		}
	}

	/**
	 * implementation of what to do when the text changed.
	 *
	 * @param value
	 * @param valueSetting
	 */
	protected abstract void setValue(double value, ValueSetting valueSetting);
}