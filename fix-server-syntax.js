const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const badBlock = `    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;`;

const goodBlock = `const PORT = process.env.PORT || 3000;`;

// Use replace but specify that we want to replace the SECOND occurrence or just a larger chunk.
// Wait, replacing 'badBlock' will just replace exactly that string.
// Let's make the search string very specific.
const specificBadBlock = `        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;`;

const specificGoodBlock = `        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;`;

if (s.includes(specificBadBlock)) {
    s = s.replace(specificBadBlock, specificGoodBlock);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Fixed syntax error in server.js');
} else {
    // try line removal
    const lines = s.split('\n');
    const newLines = [];
    for(let i=0; i<lines.length; i++) {
        if (i >= 471 && i <= 474) continue;
        newLines.push(lines[i]);
    }
    fs.writeFileSync('server.js', newLines.join('\n'), 'utf8');
    console.log('Fixed syntax error by line removal in server.js');
}
