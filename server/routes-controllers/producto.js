const express = require('express');

const { verificaToken } = require('../middlewares/autenticacion');

let app = express();

let Producto = require('../models/producto');


//============================
// Obtener todos los productos
//============================
app.get('/productos', verificaToken, (req, res) => {
    //trae todos los productos
    //populate: usuario categoria
    //paginado

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Producto.find({ disponible: true })
        .skip(desde)
        .limit(limite)
        .sort('nombre')
        .populate('usuario', 'nombre email')
        .populate('categoria', 'nombre')
        .exec((err, productosDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!productosDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se han encontrado productos'
                    }
                });
            }
            Producto.count({ disponible: true }, (err, totalProductos) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    ok: true,
                    message: 'Productos encontrados: ' + totalProductos,
                    productosDB
                })

            });

        })
});

//============================
// Obtener un producto por ID
//============================
app.get('/productos/:id', verificaToken, (req, res) => {
    //populate: usuario categoria
    let id = req.params.id;

    Producto.findById(id)
        .populate('usuario', 'nombre email')
        .populate('categoria')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se han encontrado el producto con ID: ' + id
                    }
                });
            }

            res.json({
                ok: true,
                message: 'Producto encontrado',
                productoDB
            })
        })
});

//============================
// Buscar productos
//============================
app.get('/productos/buscar/:termino', verificaToken, (req, res) => {

    let termino = req.params.termino;
    // Cogiendo el parámetro 'termino' lo pasamos a expresión regular para que sea eficiente la búsqueda
    let regex = new RegExp(termino, 'i');

    Producto.find({ nombre: regex })
        .populate('categoria')
        .exec((err, productos) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                productos
            })

        })

});


//============================
// Crear un nuevo producto
//============================
app.post('/productos', verificaToken, (req, res) => {
    //grabar el usuario
    //grabar una categoria del listado

    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
        usuario: req.usuario._id
    });

    producto.save((err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se ha creado el producto'
                }
            });
        }

        res.json({
            ok: true,
            message: 'Producto creado',
            producto: productoDB
        })

    });

});



//============================
// Actualizar un nuevo producto
//============================
app.put('/productos/:id', verificaToken, (req, res) => {
    //grabar el usuario
    //grabar una categoria del listado

    let id = req.params.id;
    let body = req.body;

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se ha actualizado el producto'
                }
            });
        }

        res.json({
            ok: true,
            message: 'Producto actualizado',
            productoDB
        })


    });


});


//============================
// Borrar un nuevo producto
//============================
app.delete('/productos/:id', verificaToken, (req, res) => {
    //No se borra fisicamente, simplemente 'disponible' pasa a falso

    let id = req.params.id;

    Producto.findByIdAndUpdate(id, { disponible: false }, { new: true, runValidators: true }, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se ha borrado el producto'
                }
            });
        }

        res.json({
            ok: true,
            message: 'Producto borrado',
            productoDB
        })
    });

});

module.exports = app;