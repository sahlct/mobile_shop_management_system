const router = require('express').Router()
const productController = require('../controllers/productControllers')

router.post('/', productController.createProduct)
router.get('/', productController.listProducts)
router.get('/:id', productController.getSingleProducts)
router.delete('/:id', productController.deleteProducts)
router.put('/:id', productController.updateProducts)

module.exports =  router