const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const Usuario = require('../models/usuario');
const Producto = require('../models/producto');

const fs = require('fs');
const path = require('path');

//default options
app.use(fileUpload());

app.put('/upload/:tipo/:id', (req, res) => {

    let tipo = req.params.tipo;
    let id = req.params.id;

    if (!req.files) {
        return res.status(400)
            .json({
                ok: false,
                err: {
                    message: 'No se ha seleccionado ningún archivo'
                }
            })
    }

    //Valida tipo
    let tiposValidos = ['productos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) {

        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las tipos permitidos son ' + tiposValidos.join(', ')
            }
        })

    }


    // Obtiene el fichero
    let file = req.files.archivo;

    let nombreCortado = file.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];

    // Extensiones permitidas
    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    //Valida la extensión
    if (extensionesValidas.indexOf(extension) < 0) {

        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las extensiones válidas son ' + extensionesValidas.join(', '),
                ext: extension
            }
        })

    }

    //Cambiar el nombre del archivo
    let nombreArchivo = `${id}-${new Date().getMilliseconds()}.${extension}`;

    //Deja la imagen en esa ruta
    file.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        //Compruebo el tipo de imagen a cargar para actualizar imagen de usuario o de producto
        if (tipo === 'usuarios') {
            imagenUsuario(id, res, nombreArchivo);
        } else {
            imagenProducto(id, res, nombreArchivo);
        }
    });

})

//Función que actualiza la imagen del usuario
function imagenUsuario(id, res, nombreArchivo) {

    //Primero busca el usuario en BD
    Usuario.findById(id, (err, usuarioDB) => {

        if (err) {
            //Llama a función de borrar imagen que se acaba de cargar, ya que ha ocurrido un error
            borraArchivo(nombreArchivo, 'usuarios');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            //Llama a función de borrar imagen que se acaba de cargar, ya que ha ocurrido un error al buscar el usuario
            borraArchivo(nombreArchivo, 'usuarios');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            });
        }

        //LLama a función de borrar imagen actual, para sólo mantener la cargada ahora
        borraArchivo(usuarioDB.img, 'usuarios');

        //Actualiza el campo 'img' con el nuevo archivo
        usuarioDB.img = nombreArchivo;

        //Guarda en BD el registro con el campo cambiado
        usuarioDB.save((err, usuarioGuardado) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                usuario: usuarioGuardado,
                img: nombreArchivo
            })
        });

    })

}

//Función que actualiza la imagen del producto
function imagenProducto(id, res, nombreArchivo) {

    //Primero busca el producto en BD
    Producto.findById(id, (err, productoDB) => {

        if (err) {
            //Llama a función de borrar imagen que se acaba de cargar, ya que ha ocurrido un error
            borraArchivo(nombreArchivo, 'productos');
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            //Llama a función de borrar imagen que se acaba de cargar, ya que ha ocurrido un error al buscar el producto
            borraArchivo(nombreArchivo, 'productos');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no existe'
                }
            });
        }

        //LLama a función de borrar imagen actual, para sólo mantener la cargada ahora
        borraArchivo(productoDB.img, 'productos');

        //Actualiza el campo 'img' con el nuevo archivo
        productoDB.img = nombreArchivo;

        //Guarda en BD el registro con el campo cambiado
        productoDB.save((err, productoGuardado) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                producto: productoGuardado,
                img: nombreArchivo
            })
        });

    })


}

// Función que borra una imagen en el sistema
function borraArchivo(nombreImagen, tipo) {

    //Path de la imagen existente en el servidor para poder borrar la actual y actualizarla con la que se acaba de cargar
    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`);

    //Si existe la imagen, se borra
    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }

}


module.exports = app;