
let carta1 = null;
let carta2 = null;
let bloqueado = false;
let paresEncontrados = 0;
const totalPares = 10;
let timer = null;
let tempoDecorrido = 0;
let nomeJogador = '';

import { consultarDiretoComFetch, insertUsuario } from "./script_db.js";

const btnIniciar = document.getElementById('iniciar-jogo');
const btnReiniciar = document.getElementById('reiniciar-jogo');
const inputNome = document.getElementById('input-nome');

const telaInicial = document.getElementById('tela-inicial');
const telaJogo = document.getElementById('area-jogo');
const telaFinal = document.getElementById('tela-final');

const hudNome = document.getElementById('hud-nome');
const hudTimer = document.getElementById('hud-timer');
const hudPares = document.getElementById('hud-pares');

const finalPontos = document.getElementById('final-pontos');
const finalTempo = document.getElementById('final-tempo');
const gridCartas = document.getElementById('grid-cartas');
// final
const rankingJogadores = document.getElementsByClassName('ranking-container');
const tBody = document.getElementById('tabela-jogadores');

btnIniciar.addEventListener('click', iniciarJogo);
btnReiniciar.addEventListener('click', reiniciarJogo);


function iniciarJogo() {
    nomeJogador = inputNome.value.trim();

    if (!nomeJogador) {
        alert("Por favor, digite seu nome para começar!");
        return;
    }

    telaInicial.classList.add('hidden');
    telaJogo.classList.remove('hidden');

    hudNome.textContent = nomeJogador;
    hudPares.textContent = `0 / ${totalPares}`;
    hudTimer.textContent = "00:00";


    tempoDecorrido = 0;
    timer = setInterval(() => {
        tempoDecorrido++;
        hudTimer.textContent = formatarTempo(tempoDecorrido);
    }, 1000);

    buscarPokemonsAleatorios(10).then(pokemons => {
        renderizarCartas(pokemons);
    });
}


async function buscarPokemonsAleatorios(quantidade) {
    gridCartas.innerHTML = "<p style='grid-column: span 5; text-align: center;'>Buscando Pokémons na PokéAPI...</p>";

    const ids = new Set();
    while (ids.size < quantidade) {
        ids.add(Math.floor(Math.random() * 151) + 1);
    }

    const pokemons = [];
    try {
        for (const id of ids) {
            // CORRIGIDO: Agora passa estritamente apenas o ID correto na URL
            const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

            if (!resp.ok) {
                throw new Error(`Erro na requisição do ID ${id}`);
            }

            const dados = await resp.json();

            pokemons.push({
                id: dados.id,
                nome: dados.name,
                imagem: dados.sprites.other['official-artwork'].front_default,
                tipo: dados.types[0].type.name
            });
        }
    } catch (error) {
        console.error('Erro ao buscar Pokémons:', error);
        gridCartas.innerHTML = "<p style='grid-column: span 5; text-align: center; color: red;'>Erro ao carregar o jogo.</p>";
    }

    return pokemons;
}


function renderizarCartas(pokemons) {
    gridCartas.innerHTML = '';


    const cartasDoJogo = [...pokemons, ...pokemons].sort(() => Math.random() - 0.5);

    cartasDoJogo.forEach(pokemon => {
        const elementoCard = document.createElement('div');
        elementoCard.classList.add('card');
        elementoCard.dataset.key = pokemon.id;

        elementoCard.innerHTML = `
            <div class="card-inner">
                <div class="card-verso"><img src="img/pokemon-go-logo-png_seeklogo-268738-removebg-preview.png" id="logo-pokemon" alt="Logo Pokémon"></div>
                <div class="card-frente">
                    <img src="${pokemon.imagem}" alt="${pokemon.nome}" loading="lazy">
                    <p>${pokemon.nome}</p>
                    <span class="badge-tipo ${pokemon.tipo}">${pokemon.tipo}</span>
                </div>
            </div>
        `;


        elementoCard.addEventListener('click', gerenciarCliqueCarta);
        gridCartas.appendChild(elementoCard);
    });
}


function gerenciarCliqueCarta() {

    if (bloqueado || this.classList.contains('card-acertada') || this.classList.contains('card-virada')) {
        return;
    }

    this.classList.add('card-virada');

    if (carta1 === null) {
        carta1 = this;
    } else {
        carta2 = this;
        bloqueado = true;


        if (carta1.dataset.key === carta2.dataset.key) {

            carta1.classList.add('card-acertada');
            carta2.classList.add('card-acertada');
            paresEncontrados++;
            hudPares.textContent = `${paresEncontrados} / ${totalPares}`;

            carta1 = null;
            carta2 = null;
            bloqueado = false;

            verificarVitoria();
        } else {

            setTimeout(() => {
                carta1.classList.remove('card-virada');
                carta2.classList.remove('card-virada');
                carta1 = null;
                carta2 = null;
                bloqueado = false;
            }, 1000);
        }
    }
}

async function verificarVitoria() {
    if (paresEncontrados !== totalPares) return;

    clearInterval(timer);

    const pontuacao = Math.max(0, Math.floor(5000 - (tempoDecorrido * 10)));
    const tempoFormatado = formatarTempo(tempoDecorrido);

    finalPontos.textContent = pontuacao;
    finalTempo.textContent = tempoFormatado;


    const sucesso = await insertUsuario(
        nomeJogador,
        pontuacao,
        tempoDecorrido
    );

    if (sucesso) {
        mostrarToast("Pontuação salva!");
    } else {
        mostrarToast("Erro ao salvar.", true);
    }

    await carregarRanking();

    telaJogo.classList.add("hidden");
    telaFinal.classList.remove("hidden");
}

function reiniciarJogo() {
    carta1 = null;
    carta2 = null;
    bloqueado = false;
    paresEncontrados = 0;
    tempoDecorrido = 0;
    nomeJogador = '';
    inputNome.value = '';

    gridCartas.innerHTML = '';
    telaFinal.classList.add('hidden');
    telaInicial.classList.remove('hidden');
}

async function carregarRanking() {

    tBody.innerHTML = "";

    const ranking = await consultarDiretoComFetch();

    ranking.forEach((jogador, indice) => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${indice + 1}</td>
            <td>${jogador.nome_jogador}</td>
            <td>${jogador.pontuacao}</td>
        `;

        tBody.appendChild(tr);

    });

}


function formatarTempo(s) {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}
function mostrarToast(mensagem, erro = false) {

    const toast = document.getElementById("toast");

    toast.innerText = mensagem;

    toast.className = "";

    if (erro) {

        toast.classList.add("erro");

    }

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

function encerrarJogo(nomeJogador, tempo_segundos, pontuacao) {

    const medalhas = ['🥇', '🥈', '🥉'];
    rankingJogadores.forEach((r, i) => {
        const destaque = r.nomeJogador === nomeJogador ? 'class="linha-destaque"' : '';
        tbody.innerHTML += `
        <tr ${destaque}>
        <td>${medalhas[i] ?? i + 1} </td>
        <td>${r.nomeJogador}</td>
        <td>${r.pontuacao.toLocaleString('pt-BR')} pts</td>
        <td>${r.tempoDecorrido} pts</td>
        </tr> `;
    })
    tBody.appendChild()
}

