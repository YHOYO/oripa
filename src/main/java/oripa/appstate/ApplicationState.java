package oripa.appstate;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;

/**
 * A template for grouped state.
 *
 * @author koji
 *
 * @param <GroupEnum>
 *            Enum of group identifier
 */
public class ApplicationState<GroupEnum> implements GroupMember<GroupEnum> {
	private final GroupEnum group;

	// This class doesn't need ActionEvent parameter but compatibility
	// with ActionListner is convenient in some cases.
	private final ArrayList<ActionListener> actions = new ArrayList<ActionListener>();

	/**
	 * A constructor which binds a group and actions to this state.
	 *
	 * @param group
	 *            group identifier
	 * @param actions
	 *            actions to be performed on this state.
	 */
	public ApplicationState(final GroupEnum group, final ActionListener... actions) {
		this.group = group;
		addActions(actions);
	}

	public void addAction(final ActionListener action) {
		this.actions.add(action);
	}

	public void addActions(final ActionListener[] actions) {
		if (actions == null) {
			return;
		}

		for (ActionListener action : actions) {
			addAction(action);
		}

	}

	/**
	 * performs actions of this state.
	 *
	 * @param e
	 */
	public void performActions(final ActionEvent e) {
		if (actions == null) {
			return;
		}

		for (ActionListener action : actions) {
			action.actionPerformed(e);
		}
	}

	@Override
	public GroupEnum getGroup() {
		return group;
	}

}
