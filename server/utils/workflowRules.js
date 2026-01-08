const VALID_TRANSITIONS = {
  "Todo": ["In Progress", "Overdue"],
  "In Progress": ["Done", "Overdue"],
  "Overdue": ["Todo", "In Progress", "Done"],
};

const canTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;

  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed) return false;

  return allowed.includes(newStatus);
};

module.exports = { canTransition };
