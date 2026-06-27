const neonHttpEndpoint = "https://ep-falling-glade-aczx46il-pooler.sa-east-1.aws.neon.tech/sql/v1/query";
const NEON_TOKEN = "napi_c44mxvrkvm1188xjab8idptcklx80p4esuhtubg3xez9y5ut6ikm1sq0d7c54wo1"; 

async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NEON_TOKEN}`
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
        return dados.rows || dados || [];

    } catch (erro) {
        console.error("Falha ao comunicar com o banco de dados:", erro);
        return null;
    }
}

export async function consultarDiretoComFetch() {
    const query = 'SELECT * FROM ranking ORDER BY pontuacao DESC LIMIT 10';
    const linhas = await executarQueryNeon(query);
    return linhas || []; 
}

export async function insertUsuario(nome_jogador, pontuacao, tempo_segundos) {
    const query = 'INSERT INTO ranking (nome_jogador , pontuacao , tempo_segundos) VALUES ($1, $2, $3) RETURNING *';
    const params = [nome_jogador , pontuacao , tempo_segundos];
    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}

export async function sqlAtualizarUsuario(id, nome_jogador, pontuacao, tempo_segundos) {
    const query = 'UPDATE ranking SET nome_jogador = $1, pontuacao = $2, tempo_segundos = $3 WHERE id = $4 RETURNING *';
    const params = [nome_jogador, pontuacao, tempo_segundos, id];
    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}

export async function sqlDeletarUsuario(id) {
    const query = 'DELETE FROM ranking WHERE id = $1 RETURNING *';
    const params = [id];
    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; 
}
