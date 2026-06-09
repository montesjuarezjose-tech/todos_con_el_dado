const express = require('express');
const path = require('path');
const fs = require('fs');
const dataPath = path.join(__dirname, 'datos_dado.json');

const app = express();

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos persistente local
let estadisticasGlobales = [0, 0, 0, 0, 0, 0];
let totalLanzamientos = 0;
let jugadores = {};

if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    estadisticasGlobales = data.estadisticasGlobales || estadisticasGlobales;
    totalLanzamientos = data.totalLanzamientos || totalLanzamientos;
    jugadores = data.jugadores || jugadores;
}

// Obtener estado actual
app.get('/api/estado', (req, res) => {
    res.json({
        totales: estadisticasGlobales,
        lanzamientos: totalLanzamientos
    });
});

// Registrar lanzamiento
app.post('/api/lanzar', (req, res) => {
    const resultado = req.body.resultado;
    const jugadorId = (req.body.jugadorId && req.body.jugadorId !== "null") 
        ? req.body.jugadorId 
        : 'anonimo_' + Math.floor(Math.random() * 1000);

    if (resultado >= 1 && resultado <= 6) {
        estadisticasGlobales[resultado - 1]++; 
        totalLanzamientos++;                   
        
        if (!jugadores[jugadorId]) {
            jugadores[jugadorId] = { caras: [0, 0, 0, 0, 0, 0], sumaTotal: 0 };
            console.log(`\n🌟 NUEVO JUGADOR: ${jugadorId}`);
        }
        
        jugadores[jugadorId].caras[resultado - 1]++;
        jugadores[jugadorId].sumaTotal += resultado;
        
        console.log(`Jugador [${jugadorId}] - Stats:`, jugadores[jugadorId]);
        console.log(`¡Alguien sacó un ${resultado}! Total global: ${totalLanzamientos}`);
        fs.writeFileSync(dataPath, JSON.stringify({ estadisticasGlobales, totalLanzamientos, jugadores }));
        
        res.json({
            totales: estadisticasGlobales,
            lanzamientos: totalLanzamientos
        });
    } else {
        res.status(400).json({ error: "Resultado inválido" });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log("=========================================");
    console.log(`🚀 Servidor listo.`);
    console.log(`👉 Abre: http://192.168.1.3:${PORT}`);
    console.log("=========================================");
});