const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
require('dotenv').config();

app.use(express.json());

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "admin"
}).then(() => console.log('Connesso a MongoDB'))
  .catch(err => console.error('Errore di connessione a MongoDB:', err));

// Schema per le storie
const conversationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  chosen_genre: String,
  chosen_item: String,
  chosen_location: String,
  character_description: String,
  storyProgress: String,         // Progresso iniziale della storia
  storyProgress_1: String,       // Progresso della storia nella continuazione
  storyProgress_2: String,       // Parte conclusiva della storia
  isCompleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// Endpoint per salvare una nuova sessione di storia
app.post('/api/save-session', async (req, res) => {
  try {
    const {
      name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      storyProgress,
      storyProgress_1,
      storyProgress_2
    } = req.body;

    // Verifica se tutte le parti della storia sono presenti
    const isCompleted = storyProgress && storyProgress_1 && storyProgress_2 ? true : false;

    if (!name || !storyProgress) {
      return res.status(400).json({ message: 'Dati mancanti per il salvataggio' });
    }

    const newConversation = new Conversation({
      name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      storyProgress,
      storyProgress_1,
      storyProgress_2,
      isCompleted  // Imposta il flag in base al completamento
    });

    await newConversation.save();

    res.status(200).json({ message: 'Storia salvata con successo', savedStory: newConversation });
  } catch (error) {
    console.error('Errore nel salvataggio della storia:', error.message);
    res.status(500).json({ message: 'Errore nel salvataggio della storia', error: error.message });
  }
});

// Endpoint per recuperare storie incomplete (con tutti i dettagli rilevanti)
app.get('/api/get-stories', async (req, res) => {
  try {
    // Recupera tutte le storie con isCompleted impostato a false
    const stories = await Conversation.find({ isCompleted: false });

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia trovata' });
    }

    // Imposta la variabile `list_story` con l'elenco delle storie incomplete
    const list_story = stories.map(story => ({
      id: story._id,
      name: story.name,
      genre: story.chosen_genre,
      item: story.chosen_item,
      location: story.chosen_location,
      description: story.character_description
    }));

    // Restituisci tutte le storie incomplete
    res.status(200).json({ stories, list_story });
  } catch (error) {
    console.error('Errore nel recupero delle storie:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie', error: error.message });
  }
});

// **Nuovo Endpoint per recuperare storie complete**
app.get('/api/get-completed-stories', async (req, res) => {
  try {
    // Recupera tutte le storie con isCompleted impostato a true
    const completedStories = await Conversation.find({ isCompleted: true });

    if (completedStories.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia completa trovata' });
    }

    // Restituisci tutte le storie complete
    res.status(200).json({ completedStories });
  } catch (error) {
    console.error('Errore nel recupero delle storie complete:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie complete', error: error.message });
  }
});

// Endpoint per aggiornare una storia esistente
app.put('/api/update-story/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      storyProgress,
      storyProgress_1,
      storyProgress_2
    } = req.body;

    const storyToUpdate = await Conversation.findById(id);

    if (!storyToUpdate) {
      return res.status(404).json({ message: 'Storia non trovata' });
    }

    // Aggiorna i campi forniti
    if (name) storyToUpdate.name = name;
    if (chosen_genre) storyToUpdate.chosen_genre = chosen_genre;
    if (chosen_item) storyToUpdate.chosen_item = chosen_item;
    if (chosen_location) storyToUpdate.chosen_location = chosen_location;
    if (character_description) storyToUpdate.character_description = character_description;

    // Aggiorna i progressi della storia
    if (storyProgress) storyToUpdate.storyProgress = storyProgress;
    if (storyProgress_1) storyToUpdate.storyProgress_1 = storyProgress_1;
    if (storyProgress_2) storyToUpdate.storyProgress_2 = storyProgress_2;

    // Verifica se la storia è completata
    storyToUpdate.isCompleted = storyToUpdate.storyProgress && storyToUpdate.storyProgress_1 && storyToUpdate.storyProgress_2 ? true : false;

    // Salva la storia aggiornata
    await storyToUpdate.save();
    res.status(200).json({ 
      message: 'Storia aggiornata con successo', 
      updatedStory: storyToUpdate 
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della storia:', error.message);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento della storia', 
      error: error.message 
    });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
