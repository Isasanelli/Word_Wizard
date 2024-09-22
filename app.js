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
  conversation_data: { type: Object, default: {} }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// Endpoint per salvare la sessione
app.post('/api/save-session', async (req, res) => {
  try {
    console.log('Dati ricevuti:', req.body); // Log per vedere i dati ricevuti
    const { name, chosen_genre, chosen_item, chosen_location, character_description, story, conversation_data } = req.body;

    if (!name || !story) {
      return res.status(400).json({ message: 'Dati mancanti per il salvataggio' });
    }

    const savedStory = await Conversation.findOneAndUpdate(
      { name },
      { chosen_genre, chosen_item, chosen_location, character_description, story, conversation_data },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Storia salvata con successo', savedStory });
  } catch (error) {
    console.error('Errore nel salvataggio della storia:', error);
    res.status(500).json({ message: 'Errore nel salvataggio della storia', error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
