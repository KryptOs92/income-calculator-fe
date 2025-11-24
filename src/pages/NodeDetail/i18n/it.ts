export default {
  nodeDetail: {
    title: "Dettaglio nodo",
    subtitle: "ID: {id}",
    fallbackName: "Nodo senza nome",
    form: {
      nameLabel: "Nome nodo",
      nameHint: "Le modifiche vengono salvate in automatico.",
      errors: {
        name: "Inserisci un nome valido.",
      },
    },
    notifications: {
      loadError: "Impossibile caricare i dettagli del nodo.",
      renameSuccess: "Nome del nodo aggiornato.",
      renameError: "Errore durante l'aggiornamento del nome.",
    },
    powers: {
      title: "Consumo energetico",
      subtitle: "Gestisci i consumi in watt del nodo.",
      actions: {
        add: "Aggiungi consumo",
      },
      columns: {
        wh: "Watt/h",
        validFrom: "Valido da",
        validTo: "Valido a",
      },
      empty: "Non hai ancora inserito il consumo del nodo",
      now: "ora",
      modal: {
        title: "Aggiungi consumo",
        fields: {
          wh: "Watt",
          effectiveFrom: "Valido da (opzionale)",
          effectiveTo: "Valido a (opzionale)",
        },
        actions: {
          cancel: "Annulla",
          confirm: "Salva",
        },
        errors: {
          wh: "Inserisci un valore numerico in Watt.",
        },
      },
      notifications: {
        loadError: "Impossibile caricare i consumi del nodo.",
        createSuccess: "Consumo salvato con successo.",
        createError: "Errore durante il salvataggio del consumo.",
      },
    },
  },
};
