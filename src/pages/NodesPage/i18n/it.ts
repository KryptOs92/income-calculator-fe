export default {
  nodesPage: {
    title: "Nodi",
    subtitle: "Gestisci i server di mining o staking che hai configurato.",
    actions: {
      add: "Aggiungi nodo",
    },
    error: "Errore durante il caricamento.. riprovare piu tardi",
    empty: {
      popup: "Non hai nessun nodo salvato",
      label: "Non hai ancora aggiunto nessun nodo :(",
      hint: 'Premi "Aggiungi nodo" per registrare il primo server.',
    },
    dialog: {
      title: "Nuovo nodo",
      fields: {
        name: "Nome",
        power: "Consumo medio (W/h)",
        uptime: "Uptime medio giornaliero",
        hours: "Ore",
        minutes: "Minuti",
      },
      uptimeHelper:
        "Fino a 24 ore al giorno. Ore e minuti saranno convertiti in secondi.",
      powerInfo: {
        title: "Che cosa significa?",
        description:
          "È il consumo medio orario in Watt. Se ad esempio il tuo server consuma 35-50W/h scegli un numero che rappresenti la media o il massimo se preferisci il worst case.",
        close: "Chiudi",
      },
      actions: {
        cancel: "Annulla",
        save: "Salva nodo",
      },
      errors: {
        name: "Inserisci un nome.",
        power: "Inserisci un consumo numerico.",
        generic: "Impossibile creare il nodo. Riprova.",
      },
    },
  },
};
