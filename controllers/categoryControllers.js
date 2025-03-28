const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

exports.createCategory = async (req, res)=>{
    try{
        if(!req.body.name){
            return res.status(422).json({
                error: "Name is required"
            })
        }

        if(await prisma.category.findUnique({
            where : { name : req.body.name}
        })){
            return res.status(409).json({
                error:`${req.body.name} is already exist!`
            })
        }

        const newCategory = await prisma.category.create({
            data:{
                name: req.body.name
            }
        })
        return res.status(201).json({
            status: "Success",
            message: "New Category Created Succesfully!",
            data : {
                ...newCategory
            }
        })

    } catch(error){
        return res.status(500).json({
            error: error.message
        })
    }
}

exports.getCategory = async (req, res)=>{
    try{
        const categories = await prisma.category.findMany()
        return res.status(200).json({
            status: "Success",
            message: "Category data fetched succesfully",
            data:categories
        })

    } catch(err){
        res.status(500).json({
            error: err.message
        })
    }
}

exports.updateCategories = async (req, res)=>{
    try{
        if(!await prisma.category.findUnique({where: {id: parseInt(req.params.id)}})){
            return res.status(404).json({error: "Cateogory Not Found!"})
        }

        if(!req.body.name){
            return res.status(422).json({
                error: "Name is required"
            })
        }

        if(await prisma.category.findUnique({
            where : { name : req.body.name}
        })){
            return res.status(409).json({
                error:`${req.body.name} is already exist!`
            })
        }

        const updateCategory = await prisma.category.update({
            data:{
                name: req.body.name
            },
            where: {
                id : parseInt(req.params.id)
            }
        })
        return res.status(200).json({
            status: "Success",
            message: "Category updated succesfully!",
            data:{
                ...updateCategory
            }
        })

    }catch(error){
        return res.status(500).json({
            error: error.message
        })
    }
}

exports.deleteCategory = async (req, res)=>{
    try{

        if(!await prisma.category.findUnique({where: {id: parseInt(req.params.id)}})){
            return res.status(404).json({error: "Cateogory Not Found!"})
        }

        await prisma.category.delete({
            where:{
                id: parseInt(req.params.id)
            }
        })
        return res.status(204).send()

    }catch(error){
        return res.status(500).json({
            error: error.message
        })
    }
}

exports.getSingleCategory = async (req, res)=>{
    try{

        const currentCategory = await prisma.category.findUnique({
            where:{
                id: parseInt(req.params.id)
            }
        })
        
        if(!currentCategory){
            return res.status(404).json({error: "Cateogory Not Found!"})
        }

        return res.status(200).json({
            status: "Success",
            message: "Category fetched successfully",
            data:{
                ...currentCategory
            }
        })

    }catch(error){
        return res.status(500).json({
            error: error.message
        })
    }
}