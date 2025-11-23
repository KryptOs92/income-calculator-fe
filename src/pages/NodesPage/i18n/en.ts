export default {
  nodesPage: {
    title: "Nodes",
    subtitle: "Monitor and configure your staking/mining servers.",
    actions: {
      add: "Add node",
      details: "Details",
      disable: "Disable",
      activate: "Activate",
    },
    sections: {
      active: "Active nodes",
      disabled: "Disabled nodes",
      count: "{count} nodes",
    },
    error: "Error while loading... please try again later.",
    emptyActive: {
      label: "No active nodes",
      hint: "Add a node to start monitoring it.",
    },
    emptyDisabled: {
      label: "No disabled nodes",
      hint: "Nothing to restore right now.",
    },
    empty: {
      popup: "You don't have any saved nodes.",
      label: "You have not added any nodes yet :(",
      hint: "Tap \"Add node\" to register your first server.",
    },
    dialog: {
      title: "Add node",
      fields: {
        name: "Name",
        power: "Average consumption (W/h)",
        uptime: "Average daily uptime",
        hours: "Hours",
        minutes: "Minutes",
      },
      uptimeHelper:
        "Up to 24h per day. Hours and minutes will be converted to seconds.",
      powerInfo: {
        title: "What does this mean?",
        description:
          "It's the average hourly consumption in watts. If your server uses 35-50W/h, pick a number that represents reality or the maximum if you prefer the worst case.",
        close: "Close",
      },
      actions: {
        cancel: "Cancel",
        save: "Save node",
      },
      errors: {
        name: "Please enter a name.",
        power: "Insert a numeric power consumption.",
        generic: "Unable to create the node. Try again.",
      },
    },
    disableDialog: {
      title: "Disable node",
      message: "Are you sure you want to disable the node?",
      actions: {
        cancel: "Cancel",
        confirm: "Yes, disable",
      },
    },
    activateDialog: {
      title: "Enable node",
      message: "Are you sure you want to re-enable the node?",
      actions: {
        cancel: "Cancel",
        confirm: "Yes, enable",
      },
    },
    notifications: {
      disableSuccess: "Node successfully disabled!",
      activateSuccess: "Node successfully re-enabled!",
      disableError: "Unable to disable the node, please try again later.",
    },
  },
};
