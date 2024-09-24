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
  story: String,
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
      story,
      isCompleted
    } = req.body;

    if (!name || !story) {
      return res.status(400).json({ message: 'Dati mancanti per il salvataggio' });
    }

    const newConversation = new Conversation({
      name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      story,
      isCompleted: isCompleted || false
    });

    await newConversation.save();

    res.status(200).json({ message: 'Storia salvata con successo', savedStory: newConversation });
  } catch (error) {
    console.error('Errore nel salvataggio della storia:', error.message);
    res.status(500).json({ message: 'Errore nel salvataggio della storia', error: error.message });
  }
});

// Endpoint per recuperare storie incomplete o basate sul nome
app.get('/api/get-stories', async (req, res) => {
  try {
    const { name, chosen_genre } = req.query;

    const query = { isCompleted: false };
    if (name) query.name = name;
    if (chosen_genre) query.chosen_genre = chosen_genre;

    const stories = await Conversation.find(query);

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia trovata' });
    }

    res.status(200).json({ stories });
  } catch (error) {
    console.error('Errore nel recupero delle storie:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie', error: error.message });
  }
});

// Endpoint per aggiornare una storia
app.put('/api/update-story/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      story,
      isCompleted
    } = req.body;

    const storyToUpdate = await Conversation.findById(id);

    if (!storyToUpdate) {
      return res.status(404).json({ message: 'Storia non trovata' });
    }

    if (name) storyToUpdate.name = name;
    if (chosen_genre) storyToUpdate.chosen_genre = chosen_genre;
    if (chosen_item) storyToUpdate.chosen_item = chosen_item;
    if (chosen_location) storyToUpdate.chosen_location = chosen_location;
    if (character_description) storyToUpdate.character_description = character_description;
    if (story) storyToUpdate.story += '\n' + story;
    if (typeof isCompleted === 'boolean') storyToUpdate.isCompleted = isCompleted;

    await storyToUpdate.save();

    res.status(200).json({ message: 'Storia aggiornata con successo', updatedStory: storyToUpdate });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della storia:', error.message);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della storia', error: error.message });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
