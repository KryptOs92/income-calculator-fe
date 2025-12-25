export default {
  nodeDetail: {
    title: "Node details",
    subtitle: "ID: {id}",
    fallbackName: "Unnamed node",
    form: {
      nameLabel: "Node name",
      nameHint: "Changes are saved automatically.",
      errors: {
        name: "Enter a valid name.",
      },
    },
    notifications: {
      loadError: "Unable to load node details. Please try again.",
      renameSuccess: "Node name updated.",
      renameError: "Unable to update the node name.",
    },
    powers: {
      title: "Power consumption",
      subtitle: "Track how many watts the node uses over time.",
      actions: {
        add: "Add node power",
        edit: "Edit node power",
        delete: "Delete node power",
        showChart: "Show chart",
        showTable: "Show table",
      },
      columns: {
        wh: "Watt/h",
        validFrom: "Valid from",
        validTo: "Valid to",
        actions: "Actions",
      },
      empty: "You have not added the node consumption yet",
      now: "now",
      modal: {
        title: "Add node power",
        fields: {
          wh: "Watt",
          effectiveFrom: "Valid from (optional)",
          effectiveTo: "Valid to (optional)",
        },
        actions: {
          cancel: "Cancel",
          confirm: "Save",
        },
        errors: {
          wh: "Enter a numeric watt value.",
        },
      },
      editModal: {
        title: "Edit node power",
        fields: {
          wh: "Watt",
          effectiveFrom: "Valid from (optional)",
          effectiveTo: "Valid to (optional)",
        },
        actions: {
          cancel: "Cancel",
          confirm: "Update",
        },
        errors: {
          wh: "Enter a numeric watt value.",
        },
      },
      deleteModal: {
        title: "Delete node power",
        message: "Are you sure you want to delete this power entry?",
        actions: {
          cancel: "Cancel",
          confirm: "Delete",
        },
      },
      notifications: {
        loadError: "Unable to load node power data.",
        createSuccess: "Power entry saved successfully.",
        createError: "Unable to save the power entry.",
        updateSuccess: "Power entry updated successfully.",
        updateError: "Unable to update the power entry.",
        deleteSuccess: "Power entry deleted successfully.",
        deleteError: "Unable to delete the power entry.",
      },
    },
  },
};
