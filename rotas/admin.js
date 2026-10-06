const express = require('express');
const appAdmin = express.Router();
const db = require('../banco/database');
const upload = require('../util/imagens');
const fs = require('fs');
const path = require('path');

// ================== ROTAS DE LOGIN E DASHBOARD ================== //

// 1. Rota principal do Admin (Login) -> GET /admin
appAdmin.get('/', (req, res) => {
    res.render('admin/login');
});

// 2. Processar formulário de login -> POST /admin/login
appAdmin.post('/login', (req, res) => {
    // Algoritmo de autenticação - FUTURO
    res.redirect('/admin/index');
});

// 3. Dashboard do Admin -> GET /admin/index
appAdmin.get('/index', (req, res) => {
    res.render('admin/index-admin');
});


// ================== ROTAS DE CATEGORIAS ================== //

// Listar todas as categorias -> GET /admin/categorias
appAdmin.get('/categorias', (req, res) => {
    db.all(
        'SELECT * FROM categorias', 
        [], 
        function (erro, categorias) {
            if (erro) {
                console.error('Erro ao listar categorias:', erro.message);
                return res.send('Erro ao consultar categorias.');
            }
            res.render('admin/categorias/lista', { categorias });
        }
    );
});

// Exibir formulário de cadastro de categoria -> GET /admin/categorias/form-cadastrar
appAdmin.get('/categorias/form-cadastrar', (req, res) => {
    res.render('admin/categorias/cadastro');
});

// Processar cadastro de categoria -> POST /admin/categorias/cadastrar
appAdmin.post('/categorias/cadastrar', (req, res) => {
    const nome = req.body.nome;
    const descricao = req.body.descricao;

    db.run(
        `INSERT INTO categorias (nome, descricao) VALUES (?, ?)`,
        [nome, descricao],
        function (erro) {
            if (erro) {
                console.error('Erro ao cadastrar categoria:', erro.message);
                return res.send('Erro ao cadastrar categoria.');
            }
            res.redirect('/admin/categorias');
        }
    );
});

// Excluir categoria -> GET /admin/categorias/excluir/:id
appAdmin.get('/categorias/excluir/:id', (req, res) => {
    const id = req.params.id;

    db.run(
        'DELETE FROM categorias WHERE id = ?',
        [id],
        function (erro) {
            if (erro) {
                console.error('Erro ao excluir categoria:', erro.message);
                return res.send('Erro ao excluir categoria.');
            }
            res.redirect('/admin/categorias');
        }
    );
});


// ================== ROTAS DE PRODUTOS ================== //

// Listar todos os produtos -> GET /admin/produtos
appAdmin.get('/produtos', (req, res) => {
    db.all(
        'SELECT * FROM produtos',
        [],
        function (erro, produtos) {
            if (erro) {
                console.error('Erro ao listar produtos:', erro.message);
                return res.send('Erro ao consultar produtos.');
            }
            res.render('admin/produtos/lista', { produtos });
        }
    );
});

// Exibir formulário de cadastro de produto -> GET /admin/produtos/form-cadastrar
appAdmin.get('/produtos/form-cadastrar', (req, res) => {
    db.all(
        'SELECT * FROM categorias',
        [],
        function (erro, categorias) {
            if (erro) {
                console.error('Erro ao buscar categorias:', erro.message);
                return res.send('Erro ao carregar categorias.');
            }
            res.render('admin/produtos/cadastro', { categorias });
        }
    );
});

// Rota para a seção infantil no site público
appAdmin.get('/infantil', (req, res) => {
    db.all(
        "SELECT * FROM produtos WHERE genero = 'I'", 
        [], 
        (erro, produtosInfantis) => {
            if (erro) {
                return res.send("Erro ao carregar produtos infantis.");
            }
            res.render('infantil', { produtos: produtosInfantis });
        }
    );
});

// Processar cadastro de produto -> POST /admin/produtos/cadastrar
appAdmin.post('/produtos/cadastrar', upload.single('imagem'), (req, res) => {
    const nome = req.body.nome;
    const categoria = req.body.categoria;
    const valor = req.body.valor;
    const marca = req.body.marca;
    const tamanho = req.body.tamanho;
    const genero = req.body.genero; // Captura o campo genero (M/F/U)
    const estoque = req.body.estoque;
    const descricao = req.body.descricao;
    
    const imagem = req.file ? req.file.filename : null;

    db.run(
        `INSERT INTO produtos (nome, categoria, valor, estoque, descricao, imagem, marca, tamanho, genero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, categoria, valor, estoque, descricao, imagem, marca, tamanho, genero],
        function (erro) {
            if (erro) {
                console.error('Erro ao cadastrar produto:', erro.message);
                return res.send(`Erro ao cadastrar produto: ${erro.message}`);
            }
            res.redirect('/admin/produtos');
        }
    );
});

// Excluir produto e apagar a imagem salva -> GET /admin/produtos/excluir/:id
appAdmin.get('/produtos/excluir/:id', (req, res) => {
    const id = req.params.id;

    // 1. Busca a imagem do produto para apagar da pasta public/uploads
    db.get('SELECT imagem FROM produtos WHERE id = ?', [id], (erro, produto) => {
        if (erro) {
            console.error('Erro ao consultar produto para exclusão:', erro.message);
            return res.send('Erro ao excluir produto.');
        }

        // Se o produto tiver imagem registrada, deleta o arquivo físico do computador
        if (produto && produto.imagem) {
            const caminhoImagem = path.join(__dirname, '../public/uploads', produto.imagem);
            fs.unlink(caminhoImagem, (err) => {
                if (err) console.log('Aviso ao apagar imagem do disco:', err.message);
            });
        }

        // 2. Apaga o registro do banco de dados
        db.run('DELETE FROM produtos WHERE id = ?', [id], function (erro) {
            if (erro) {
                console.error('Erro ao deletar produto do banco:', erro.message);
                return res.send('Erro ao excluir produto.');
            }
            res.redirect('/admin/produtos');
        });
    });
});

module.exports = appAdmin;