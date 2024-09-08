const express = require('express');
const weatherRoutes = require('./routes/weatherRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', weatherRoutes);
app.use('/api', routeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});