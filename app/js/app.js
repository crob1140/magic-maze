import ai from './ai';
import board from './board';
import clock from './clock';
import config from './config';
import events from './events';
import game from './game';
import Hero from './hero';
import heroes from './heroes';
import p5 from 'p5';
import sketch from './sketch';
import Tile from './tile';
import tiles from './tiles';

let allTiles = [];
let scenarios = [];
window.socket = io({transports: ['websocket'], upgrade: false});
window.role = [];

fetch('data/tiles.json').then(response => response.json()).then(data => {
    allTiles = data;
});

fetch('data/scenarios.json').then(response => response.json()).then(data => {
    scenarios = data;
});

function start(options) {
    new p5(sketch);
    game.init(options);
    const deck = buildDeck(options.scenario);
    tiles.init(deck);
    board.init();
    events.init();
    heroes.init();
    clock.init();
    if (game.isAdmin()) ai.run();
}

function buildDeck(scenario) {
    let deck = {};
    const ids = scenarios[scenario].tiles;

    for (let id of ids) {
        deck[id] = allTiles[id];
    }

    return deck;
}

const $ui = document.getElementById('ui');
const $admin = document.getElementById('admin');
const $people = document.getElementById('people');
const $spectator = document.getElementById('spectator');

// FIXME: why is this not reliable?
socket.on('people', people => {
    $people.innerHTML = people;
    $people.innerHTML += people > 1 ? ' joueurs connectés' : ' joueur connecté';
});

socket.on('admin', () => {
    // Timeout needed to give time for 'players' event
    setTimeout(() => {
        $admin.innerHTML += `<h3>Maître du jeu</h3>
        <p>Bot(s) <input type="number" id="bots" value="0" min="0" max="7" /></p>
        <p>Scénario <input type="number" id="scenario" value="1" min="1" max="15" /></p>
        <button id="start">Commencer la partie !</button>`;

        document.getElementById('start').addEventListener('click', () => {
            socket.emit('prestart');
        });

    }, 100);
});

socket.on('prestart', isAdmin => {
    const spectator = $spectator.checked;
    if (isAdmin) {
        const bots = parseInt(document.getElementById('bots').value);
        const scenario = parseInt(document.getElementById('scenario').value);
        socket.emit('settings', { bots, scenario, spectator });
    } else {
        socket.emit('settings', { spectator });
    }
});

socket.on('start', options => {
    start(options);

    if (options.admin) {
        // Admin only
        document.getElementById('admin').remove();
    }
});

socket.on('role', roles => {
    // Save my role in window.role
    role = roles;

    // Display role
    let text = '<p>Actions autorisées : ';
    for (let i in roles) {
        i = parseInt(i);
        text += roles[i];
        if (roles[i + 1]) text += ', ';
    }
    text += '.</p>'

    $ui.innerHTML += text;
});

socket.on('hero', data => {
    const hero = heroes.all[data.id];
    const cell = data.cell;
    hero.set(cell.x, cell.y);
});

socket.on('board', data => {
    board.save(data.x, data.y, data.cell)
});

socket.on('tile', data => {
    const tile = tiles.getTile(data.tile.id);
    tile.rotation = data.tile.rotation;
    tile.set(data.x, data.y);
    tiles.board.push(tile.id);
});

socket.on('invertClock', data => {
    clock.invert();
});

socket.on('used', data => {
    board.setUsed(data.x, data.y);
});

socket.on('ai', data => {
    ai.run();
});
