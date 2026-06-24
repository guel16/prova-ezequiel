const DATABASE_URL = "postgresql://neondb_owner:npg_Lq1vulKFRE8j@ep-falling-glade-aczx46il-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const TOKEN = "napi_s6z06e2xqz45f85wamao4064vextqid07vg8bzcp29aleu2jgvb3iwun3rjvemkp"

const host = new URL(DATABASE_URL).host;
const neonHttpEndpoint = `https://${host}/sql`;

async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {
                'Neon-Connection-String': DATABASE_URL,
                'Content-Type': 'application/json'
            },  
            body: JSON.stringify({
                query: querySQL,
                params: parametros 
            })
        });

        if (!resposta.ok){
            const erroTexto = await resposta.text();
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`);
        }

        const dados = await resposta.json();
        return dados.rows;

    } catch (erro) {
        console.error("Falha ao comunicar com o banco de dados:", erro);
        return null;
    }
}


export async function consultarDiretoComFetch() {
    console.log("Buscando todos os usuários no banco...");
    const query = 'SELECT * FROM ranking ORDER BY pontuacao DESC LIMIT 10';

    const linhas = await executarQueryNeon(query);
    return linhas || []; 
}


export async function insertUsuario(nome, email, status) {
    console.log("Cadastrando usuário no banco:", { nome, email, status });
    const query = 'INSERT INTO ranking (nome_jogador , pontuacao , tempo_segundos) VALUES ($1, $2, $3) RETURNING *';
    const params = [nome_jogador , pontuacao , tempo_segundos];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}

// --- U (UPDATE / ATUALIZAR) ---
export async function sqlAtualizarUsuario(id, nome, email, status) {
    console.log("Atualizando usuário no banco. ID:", id);
    const query = 'UPDATE usuarios SET nome = $1, email = $2, status = $3 WHERE id = $4 RETURNING *';
    const params = [nome, email, status, id]; // A ordem importa! O ID é o $4

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}

export async function sqlDeletarUsuario(id) {
    console.log("Deletando usuário do banco. ID:", id);
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
    const params = [id];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}