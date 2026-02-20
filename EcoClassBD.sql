CREATE DATABASE IF NOT EXISTS ecoclass;
USE ecoclass;

select * from usuarios;
ALTER TABLE usuarios ADD COLUMN adm BOOLEAN DEFAULT FALSE;
UPDATE usuarios SET adm = TRUE WHERE email = '';

CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    descricao TEXT,
    criador_original VARCHAR(255),
    usuario_uploader VARCHAR(255),
    nome_arquivo VARCHAR(255),
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE denuncias_videos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    video_id       INT NOT NULL,
    titulo_video   VARCHAR(255) NOT NULL,
    motivo         TEXT NOT NULL,
    data_denuncia  DATETIME DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(50) DEFAULT 'pendente'
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    nome_usuario VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL
);

CREATE TABLE residuos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    classe VARCHAR(100), 
    risco_score INT,
    risco_nivel VARCHAR(50), 
    toxico BOOLEAN,
    metais_pesados BOOLEAN,
    corrosivo BOOLEAN,
    inflamavel BOOLEAN,
    incompativeis TEXT,
    armazenamento_bom TEXT, 
    armazenamento_ruim TEXT
);

CREATE TABLE historico_avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    residuo_nome VARCHAR(255) NOT NULL,
    risco_score INT NOT NULL,
    data_consulta DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo o dado de exemplo da sua imagem
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Hipoclorito de Sódio (Desinfetante)', 
    'Classe I - Perigoso', 
    8, 
    'Muito Perigoso', 
    1, 0, 1, 0, 
    'Ácidos,Produtos Amoniacais,Metais,Materiais Orgânicos',
    'Local ventilado,Longe de alimentos,Em tambor de PEAD',
    'Não armazenar perto de vinagre,Não misturar com outros produtos,Manter longe de tecidos'
);

INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Hidróxido de Sódio (Soda Cáustica Sólida)', 
    'Classe I - Perigoso (Corrosivo)', 
    9, 
    'Extremo', 
    1, 0, 1, 0, 
    'Ácidos Fortes,Água (reação violenta),Alumínio,Zinco,Clorofórmio',
    'Recipientes de PEAD (Plástico),Local seco,Hematicamente fechado',
    'Não usar vidro (pode travar),Longe de umidade,Não armazenar com ácidos'
);

-- 2. Permanganato de Potássio - Oxidante Forte
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Permanganato de Potássio', 
    'Classe I - Perigoso (Oxidante/Tóxico)', 
    8, 
    'Muito Perigoso', 
    1, 1, 1, 1, 
    'Glicerina,Etanol,Enxofre,Solventes Orgânicos,Ácido Sulfúrico',
    'Frasco de vidro escuro,Armário de oxidantes,Longe de calor',
    'Não misturar com materiais orgânicos,Longe de combustíveis,Não usar papelão'
);

-- 3. Sódio Metálico - Reativo com Água
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Sódio Metálico', 
    'Classe I - Perigoso (Inflamável/Reativo)', 
    10, 
    'Crítico', 
    1, 0, 1, 1, 
    'Água,Umidade do ar,Ácidos,Halogênios,Extintor de CO2',
    'Imerso em óleo mineral/querosene,Pote metálico,Local à prova de fogo',
    'NUNCA expor à água,Longe de sprinklers,Não descartar na pia'
);

-- 4. Acetato de Chumbo - Metal Pesado
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Acetato de Chumbo', 
    'Classe I - Perigoso (Tóxico)', 
    7, 
    'Alto Risco', 
    1, 1, 0, 0, 
    'Ácidos fortes,Bromatos,Fenol,Sulfetos',
    'Recipiente fechado,Área de metais pesados,Ventilação local',
    'Longe de alimentos,Não gerar poeira,Evitar contato com a pele'
);

-- 5. Fenol (Ácido Fênico) - Sólido Orgânico
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Fenol Sólido (Ácido Fênico)', 
    'Classe I - Perigoso (Tóxico/Corrosivo)', 
    9, 
    'Muito Perigoso', 
    1, 0, 1, 1, 
    'Oxidantes fortes,Hipoclorito de Cálcio,Alumínio,Bases fortes',
    'Local fresco (<25°C),Protegido da luz,Ventilação exaustora',
    'Longe de fontes de ignição,Não armazenar com oxidantes,Evitar calor'
);

-- 6. Ácido Bórico - Moderado
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Ácido Bórico', 
    'Classe II - Não Inerte', 
    4, 
    'Moderado', 
    1, 0, 0, 0, 
    'Potássio,Anidridos ácidos,Bases fortes',
    'Local seco,Temperatura ambiente,Embalagem original',
    'Longe de umidade excessiva,Não ingerir'
);

-- 7. Sulfato de Cobre Pentahidratado
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Sulfato de Cobre', 
    'Classe I - Perigoso (Ecotóxico)', 
    5, 
    'Moderado/Ambiental', 
    1, 1, 1, 0, 
    'Magnésio,Hidroxilamina,Metais em pó',
    'Sacos plásticos selados,Local seco,Longe de ralos',
    'Não descartar no solo,Evitar umidade (aglutina)'
);

-- 8. Nitrato de Prata - Oxidante/Corrosivo
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Nitrato de Prata', 
    'Classe I - Perigoso (Oxidante)', 
    8, 
    'Alto Risco', 
    1, 1, 1, 0, 
    'Acetileno,Amônia,Etanol,Água Oxigenada',
    'Frasco âmbar (escuro),Longe da luz,Armário de oxidantes',
    'Não expor à luz (escurece),Longe de materiais combustíveis'
);

-- 9. Carbeto de Cálcio (Carbureto)
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Carbeto de Cálcio (Carbureto)', 
    'Classe I - Perigoso (Inflamável/Reativo)', 
    8, 
    'Muito Perigoso', 
    0, 0, 1, 1, 
    'Água (gera gás acetileno explosivo),Umidade,Ácidos',
    'Tambores de aço estanques,Local seco e ventilado,Sinalizado',
    'NUNCA expor à chuva ou umidade,Longe de faíscas'
);

-- 10. Dicromato de Potássio - Cancerígeno
INSERT INTO residuos (nome, classe, risco_score, risco_nivel, toxico, metais_pesados, corrosivo, inflamavel, incompativeis, armazenamento_bom, armazenamento_ruim)
VALUES (
    'Dicromato de Potássio', 
    'Classe I - Perigoso (Cancerígeno/Oxidante)', 
    10, 
    'Crítico', 
    1, 1, 1, 1, 
    'Materiais combustíveis,Agentes redutores,Hidrazina,Ácidos anidros',
    'Acesso restrito,Recipiente hermético,Sinalização de Câncer',
    'Não inalar pó,Longe de qualquer material orgânico'
);