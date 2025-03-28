const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

exports.createProduct = async (req, res)=>{
    try{

        if(!req.body.name){
            return res.status(422).json({ error: "Name is required"})
        }

        if(!req.body.price){
            return res.status(422).json({ error: "Price is required"})
        } else {
            if(typeof req.body.price !== 'number' || req.body.price < 0 ){
                return res.status(422).json({ error:'Price must be a non-negative number!'})
            }
        }

        if(!req.body.categoryId){
            return res.status(422).json({ error: "category Id is required"})
        } else {
            if(!await prisma.category.findUnique({ where: { id: parseInt(req.body.categoryId)}})){
                return res.status(404).json({ error: "Category not found!"})
            }
        }

        const newProduct = await prisma.product.create({
            data: req.body
        })

        const categoryDetails = await prisma.category.findUnique({ where: { id: req.body.categoryId}})

        return res.status(201).json({
            status: "Success",
            message: "Product Created Successfully",
            data: {
                ...newProduct,
                category: categoryDetails
            }
        })

    }catch(error){
        return res.status(500).json({ error: error.message})
    }
}

exports.listProducts = async (req, res)=>{
    try{
        const products = await prisma.product.findMany()
        return res.status(200).json({
            status: "Success",
            message: "products Fetched succesfully",
            date: products
        })

    }catch(error){
        return res.status(500).json({error: error.message})
    }
}

exports.getSingleProducts = async (req, res)=>{
    try{
        const singleProduct = await prisma.product.findUnique({where: { id: parseInt(req.params.id)}})
        if(!singleProduct){ return res.status(404).json({ error: 'Product not Found!'})}
        return res.status(200).json({
            status: "Success",
            message: "Product Fetched Succesfully",
            data: singleProduct
        })

    }catch(error){
        return res.status(500).json({error: error.message})
    }
}

exports.deleteProducts = async (req, res)=>{
    try{
     
        if(!await prisma.product.findUnique({where: {id: parseInt(req.params.id)}})){
            return res.status(404).json({ error:'Product not found!'})
        }

        await prisma.product.delete({
            where: {id: parseInt(req.params.id)}
        })
        return res.status(204).send()


    }catch(error){
        return res.status(500).json({ error: error?.message})
    }
}

exports.updateProducts = async (req, res)=>{
    try{
        if(!await prisma.product.findUnique({where: {id: parseInt(req.params.id)}})){
            return res.status(404).json({error: 'Product Not Found!'})
        }

        if(!req.body.name){
            return res.status(422).json({error:'name is Required!'})
        }
        
        if(!req.body.price){
            return res.status(422).json({error:'price is Required!'})
        }else{
            if(typeof req.body.price !== 'number' || req.body.price < 0){
                return res.status(422).json({ error: "price must be a valid non-negative number!"})
            }
        }

        if(!req.body.categoryId){
            return res.status(422).json({ error: "category Id is required"})
        } else {
            if(!await prisma.category.findUnique({ where: { id: parseInt(req.body.categoryId)}})){
                return res.status(404).json({ error: "Category not found!"})
            }
        }

        const NewData = await prisma.product.update({
            data : req.body,
            where:{ id: parseInt(req.params.id)}
        })
        return res.status(200).json({
            status: "Success",
            message: "product updated succesfully!",
            data: {
                ...NewData
            }
        })

    }catch(error){
        return res.status(500).json({error: error.message})
    }
}