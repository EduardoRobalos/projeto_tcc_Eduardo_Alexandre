const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const connection = require("./models/db");
const validator = require('validator');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAq9chG9poAieKAb9aHTaWnO1HTZ2cDRas");

const app = express();
const PORT = 3000;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ecoclass2025.br@gmail.com',
        pass: 'slmpzclhkosqqiho'
    }
});

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'html/cadastro.html'));
});

app.get('/check-username', (req, res) => {
    const nome = req.query.nome;

    if (!nome) return res.json({ exists: false });

    const sql = "SELECT count(*) as total FROM usuarios WHERE nome_usuario = ?";

    connection.query(sql, [nome], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro no servidor" });
        }

        const existe = results[0].total > 0;
        res.json({ exists: existe });
    });
});

app.get('/check-email', (req, res) => {
    const email = req.query.email;

    if (!email) return res.json({ exists: false });

    const sql = "SELECT count(*) as total FROM usuarios WHERE email = ?";

    connection.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro no servidor" });
        }

        const existe = results[0].total > 0;
        res.json({ exists: existe });
    });
});

app.get('/recuperar', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/recuperar.html'));
});

app.get('/search-residuo', (req, res) => {
    const termo = req.query.term;

    if (!termo) return res.json([]);

    const sql = "SELECT * FROM residuos WHERE nome LIKE ?";
    connection.query(sql, [`%${termo}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro no banco" });
        }
        res.json(results);
    });
});

app.get('/get-history', (req, res) => {
    const email = req.query.email;
    const sql = "SELECT residuo_nome, risco_score, data_consulta FROM historico_avaliacoes WHERE user_email = ? ORDER BY data_consulta DESC";

    connection.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/get-user-profile/:nome_usuario', (req, res) => {
    const profile = req.params.nome_usuario;
    console.log(profile)
    if (!profile || profile === 'null' || profile === 'undefined') {
        return res.status(400).json({ error: "Nome de usuário inválido." });
    }

    const sql = "SELECT nome_completo, nome_usuario, email FROM usuarios WHERE nome_usuario = ?";

    connection.query(sql, [profile], (err, results) => {
        if (err) {
            console.error("Erro SQL:", err);
            return res.status(500).send("Erro no banco");
        }

        if (results.length > 0) res.json(results[0]);
        else res.status(404).send("Usuário não encontrado");
    });
});


app.get('/get-history', (req, res) => {
    const email = req.query.email;

    const sql = `
        SELECT h.*, r.classe, r.corrosivo, r.toxico, r.inflamavel 
        FROM historico_avaliacoes h
        LEFT JOIN residuos r ON h.residuo_nome = r.nome
        WHERE h.user_email = ? 
        ORDER BY h.data_consulta DESC`;

    connection.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Você é o 'Especialista em Segurança Virtual' do sistema EcoClass. 
        O seu papel é ajudar os alunos e trabalhadores com dúvidas sobre produtos químicos, 
        uso de EPIs, descartes e protocolos de emergência.
        Responda de forma direta, profissional, em português, e nunca dê respostas longas demais.
        
        Dúvida do utilizador: ${message}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.json({ reply: responseText });
    } catch (error) {
        console.error("Erro no Gemini:", error);
        res.status(500).json({ error: "Erro ao consultar a IA." });
    }
});

app.post('/save-history', (req, res) => {
    const { email, residuo, score } = req.body;
    const sql = "INSERT INTO historico_avaliacoes (user_email, residuo_nome, risco_score) VALUES (?, ?, ?)";

    connection.query(sql, [email, residuo, score], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Histórico salvo!" });
    });
});

app.post('/register', async (req, res) => {
    try {
        const { fullname, username, email, password } = req.body;

        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios." });
        }

        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO usuarios (nome_completo, nome_usuario, email, senha_hash) VALUES (?, ?, ?, ?, ?)`;
        const values = [fullname, username, email, hashedPassword];

        connection.query(sql, values, (err, result) => {
            if (err) {
                console.error('❌ Erro na Query SQL:', err.sqlMessage);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: "Usuário ou Email já cadastrados." });
                }
                return res.status(500).json({ message: "Erro ao salvar no banco: " + err.sqlMessage });
            }

            console.log(`✅ Usuário ${username} cadastrado!`);
            res.status(201).json({ message: "Cadastro realizado com sucesso!" });
        });

    } catch (error) {
        console.error('❌ Erro no Servidor:', error);
        res.status(500).json({ message: "Erro interno no processamento." });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM usuarios WHERE nome_usuario = ?";

    connection.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ message: "Erro no banco de dados." });

        if (results.length === 0) {
            return res.status(401).json({ message: "Usuário não encontrado." });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.senha_hash);

        if (match) {
            res.status(200).json({
                message: "Login autorizado!",
                userData: {
                    nome: user.nome_completo,
                    nome_usuario: user.nome_usuario,
                    adm: user.adm
                }
            });
        } else {
            res.status(401).json({ message: "Senha incorreta." });
        }
    });
});

app.post('/change-password', (req, res) => {
    const { nome_usuario, oldPassword, newPassword } = req.body;

    if (!nome_usuario) {
        return res.status(400).json({ message: "Usuário não identificado." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const sql = "SELECT senha_hash FROM usuarios WHERE nome_usuario = ? LIMIT 1";

    connection.query(sql, [nome_usuario], async (err, results) => {
        if (err) return res.status(500).json({ message: "Erro no banco de dados." });

        if (results.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });

        const senhaHash = results[0].senha_hash;

        const ok = await bcrypt.compare(oldPassword, senhaHash);
        if (!ok) return res.status(401).json({ message: "Senha atual incorreta." });

        const newHash = await bcrypt.hash(newPassword, 10);

        const upd = "UPDATE usuarios SET senha_hash = ? WHERE nome_usuario = ?";

        connection.query(upd, [newHash, nome_usuario], (err2, result) => {
            if (err2) return res.status(500).json({ message: "Erro ao atualizar senha." });

            if (result.affectedRows === 0) return res.status(404).json({ message: "Erro ao atualizar o registro." });

            return res.json({ message: "Senha atualizada com sucesso!" });
        });
    });
});


app.post('/update-username', (req, res) => {
    const { email, username } = req.body;

    const sqlCheck = "SELECT count(*) as total FROM usuarios WHERE nome_usuario = ?";
    connection.query(sqlCheck, [username], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro no servidor." });

        if (results[0].total > 0) {
            return res.status(409).json({ message: "Este nome de usuário já está em uso." });
        }

        const sqlUpdate = "UPDATE usuarios SET nome_usuario = ? WHERE email = ?";

        connection.query(sqlUpdate, [username, email], (err2, result) => {
            if (err2) return res.status(500).json({ message: "Erro ao atualizar no banco." });

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Usuário não encontrado para atualizar." });
            }

            console.log(`✅ Nome de usuário alterado para: ${username}`);
            return res.status(200).json({ message: "Nome de usuário atualizado com sucesso!" });
        });
    });
});

app.post('/update-email', (req, res) => {

    const { oldEmail, newEmail } = req.body;

    if (!newEmail || !validator.isEmail(newEmail)) {
        return res.status(400).json({ message: "E-mail inválido." });
    }

    const sqlCheck = "SELECT count(*) as total FROM usuarios WHERE email = ?";
    connection.query(sqlCheck, [newEmail], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro no servidor." });

        if (results[0].total > 0) {
            return res.status(409).json({ message: "Este e-mail já está em uso." });
        }

        const sqlUpdate = "UPDATE usuarios SET email = ? WHERE email = ?";

        connection.query(sqlUpdate, [newEmail, oldEmail], (err2, result) => {
            if (err2) return res.status(500).json({ message: "Erro ao atualizar e-mail." });
            if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });

            return res.status(200).json({ message: "E-mail atualizado com sucesso!" });
        });
    });
});

app.post('/recuperar-senha', (req, res) => {
    const { email } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ?";
    connection.query(sql, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro interno no banco de dados." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Este e-mail não foi encontrado no nosso sistema." });
        }

        console.log(`📧 Solicitação de senha para: ${email}`);
        res.status(200).json({ message: "E-mail de redefinição enviado com sucesso!" });
    });

    const mailOptions = {
        from: 'EcoClass <ecoclass2025.br@gmail.com>',
        to: email,
        subject: 'Redefinição de Senha - EcoClass',
        html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2 style="color: #0f7143;">Recuperação de Senha EcoClass</h2>
                    <p>Você solicitou a mudança de senha para sua conta.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha:</p>
                    <a href="http://localhost:3000/html/novaSenha.html?email=${email}" 
                       style="background-color: #00bfa5; color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; display: inline-block; margin-top: 10px;">
                       Redefinir Minha Senha
                    </a>
                    <p style="margin-top: 20px; font-size: 12px; color: #888;">Se você não solicitou isso, ignore este e-mail.</p>
                </div>
            `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Erro ao enviar e-mail." });
        }
        res.status(200).json({ message: "E-mail enviado com sucesso!" });
    });
});

app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: "Dados incompletos." });
    }

    try {

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const sql = "UPDATE usuarios SET senha_hash = ? WHERE email = ?";

        connection.query(sql, [hashedPassword, email], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Erro ao atualizar senha no banco." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            res.status(200).json({ message: "Senha alterada com sucesso! Faça login agora." });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

app.get('/videos', (req, res) => {
    const sql = 'SELECT * FROM videos';
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/upload-video', (req, res) => {
    const { titulo, categoria, descricao, criadorOriginal, usuarioUploader, nomeArquivo } = req.body;

    const sql = `INSERT INTO videos (titulo, categoria, descricao, criador_original, usuario_uploader, nome_arquivo) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [titulo, categoria, descricao, criadorOriginal, usuarioUploader, nomeArquivo], (err, result) => {
        if (err) {
            console.error("Erro ao salvar vídeo:", err);
            return res.status(500).json({ error: "Erro interno no banco de dados" });
        }
        res.status(201).json({ message: "Vídeo salvo com sucesso!", id: result.insertId });
    });
});

app.get('/get-videos', (req, res) => {

    const sql = `SELECT * FROM videos ORDER BY data_envio DESC`;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar vídeos:", err);
            return res.status(500).json({ error: "Erro ao buscar vídeos" });
        }
        res.json(results);
    });
});

app.post('/videos/denunciar', (req, res) => {
    const { videoId, tituloVideo, motivo } = req.body;

    if (!videoId || !tituloVideo || !motivo) {
        return res.status(400).json({ message: "Dados da denúncia incompletos." });
    }

    const sqlInsert = `
        INSERT INTO denuncias_videos 
        (video_id, titulo_video, motivo, data_denuncia) 
        VALUES (?, ?, ?, NOW())
    `;

    connection.query(sqlInsert, [videoId, tituloVideo, motivo], (err, result) => {
        if (err) {
            console.error("Erro ao salvar denúncia no banco:", err);
            return res.status(500).json({ message: "Erro interno ao registrar denúncia." });
        }

        const sqlCount = "SELECT COUNT(*) as total FROM denuncias_videos WHERE video_id = ?";

        connection.query(sqlCount, [videoId], (errCount, resultsCount) => {
            if (errCount) {
                console.error("Erro ao contar denúncias:", errCount);
                return res.status(200).json({ message: "Denúncia salva, mas houve um erro na contagem." });
            }

            const totalDenuncias = resultsCount[0].total;
            const limiteAtingido = totalDenuncias >= 3;


            if (limiteAtingido) {
                const sqlDelete = "DELETE FROM videos WHERE id = ?";
                connection.query(sqlDelete, [videoId], (errDelete) => {
                    if (errDelete) console.error("Erro ao deletar vídeo:", errDelete);
                    else console.log(`🗑️ Vídeo ID ${videoId} removido automaticamente (3 denúncias).`);
                });
            }

            const statusAviso = limiteAtingido
                ? "<h3 style='color:red;'>🚨 VÍDEO REMOVIDO AUTOMATICAMENTE (3 Denúncias atingidas)</h3>"
                : `<p>Status de Moderação: <b>${totalDenuncias}/3 denúncias</b>.</p>`;

            const mailOptions = {
                from: 'EcoClass <ecoclass2025.br@gmail.com>',
                to: 'ecoclass2025.br@gmail.com',
                subject: `🚨 Denúncia (${totalDenuncias}/3): ${tituloVideo} - EcoClass`,
                html: `
                    <h2 style="color: #d63031;">Nova denúncia recebida</h2>
                    ${statusAviso}
                    <p><strong>ID do Vídeo:</strong> ${videoId}</p>
                    <p><strong>Título do Vídeo:</strong> ${tituloVideo}</p>
                    <p><strong>Motivo da denúncia:</strong></p>
                    <blockquote style="border-left: 4px solid #d63031; padding-left: 12px; color: #444;">
                        ${motivo}
                    </blockquote>
                    <p style="margin-top: 20px;">
                        <small>Recebida em: ${new Date().toLocaleString('pt-BR')}</small>
                    </p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.error("Falha ao enviar e-mail de denúncia:", error);


                if (limiteAtingido) {
                    return res.status(200).json({ message: "Denúncia registrada! O vídeo atingiu o limite de infrações e foi removido da plataforma." });
                } else {
                    return res.status(200).json({ message: `Denúncia registrada com sucesso! (${totalDenuncias}/3)` });
                }
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
