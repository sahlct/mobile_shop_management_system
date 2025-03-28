const router = require('express').Router()
const categoryController = require('../controllers/categoryControllers')

router.post('/', categoryController.createCategory)
router.get('/', categoryController.getCategory )
router.get('/:id', categoryController.getSingleCategory)
router.put('/:id', categoryController.updateCategories)
router.delete('/:id', categoryController.deleteCategory)

module.exports =  router