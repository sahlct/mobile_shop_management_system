const express = require('express')
const cors = require('cors');

const port = 5000;
const app = express()
app.use(express.json())


app.use(cors({
    origin: 'http://localhost:3000',  // your local frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.options('*', cors()); // Handle preflight requests

app.use('/users', require('./routes/userRoutes'))
app.use('/mobiles', require('./routes/mobilesRoutes'))
app.use('/accessories', require('./routes/accessoriesRoutes'))
app.use('/services', require('./routes/serviceRoutes'))

app.listen(port, () => console.log(`Server Started on Port ${port}`))

// module.exports = app;