const express = require('express')

const port = 3000
const app = express()
app.use(express.json())

app.use('/categories', require('./routes/categoryRoutes'))
app.use('/products', require('./routes/productsRoutes'))

app.listen(port, ()=>console.log(`Server Started on Port ${port}`))