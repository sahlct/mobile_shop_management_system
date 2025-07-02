const router = require('express').Router()
const serviceContrroller = require('../controllers/serviceControllers')

router.post('/', serviceContrroller.createService)
router.get('/', serviceContrroller.getAllServices)
router.get('/:m04_id', serviceContrroller.getSingleService)
router.delete('/:m04_id', serviceContrroller.deleteService)
router.put('/:m04_id', serviceContrroller.updateService)

module.exports = router