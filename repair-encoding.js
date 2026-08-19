const fs = require('fs');

const replacements = [
    [/\b(Catlogo|CatÃ¡logo)\b/g, 'Catálogo'],
    [/\b(catlogo|catÃ¡logo)\b/g, 'catálogo'],
    [/\b(BSQUEDA|BÃšSQUEDA)\b/g, 'BÚSQUEDA'],
    [/\b(Bsqueda|BÃºsqueda)\b/g, 'Búsqueda'],
    [/\b(Envo|EnvÃo)\b/g, 'Envío'],
    [/\b(tecnologa|tecnologÃa)\b/g, 'tecnología'],
    [/\b(mvil|mÃ³vil)\b/g, 'móvil'],
    [/\b(garanta|garantÃa)\b/g, 'garantía'],
    [/\b(Garantas|GarantÃas)\b/g, 'Garantías'],
    [/\b(Garanta|GarantÃa)\b/g, 'Garantía'],
    [/\b(Ros|RÃos)\b/g, 'Ríos'],
    [/\b(Jos|JosÃ©)\b/g, 'José'],
    [/\b(Coln|ColÃ³n)\b/g, 'Colón'],
    [/\b(Sbados|SÃ¡bados)\b/g, 'Sábados'],
    [/\b(Informacin|InformaciÃ³n)\b/g, 'Información'],
    [/\b(Trminos|TÃ©rminos)\b/g, 'Términos'],
    [/\b(Polticas|PolÃticas)\b/g, 'Políticas'],
    [/\b(dueos|dueÃ±os)\b/g, 'dueños'],
    [/\b(Da|DÃa)\b/g, 'Día'],
    [/\b(da|dÃa)\b/g, 'día'],
    [/\b(electrnico|electrÃ³nico)\b/g, 'electrónico'],
    [/\b(Mximo|MÃ¡ximo)\b/g, 'Máximo'],
    [/(Â¡Compra|Compra)\b/g, '¡Compra'],
    [/\b(cargarn|cargarÃ¡n)\b/g, 'cargarán'],
    [/\b(dinmicamente|dinÃ¡micamente)\b/g, 'dinámicamente'],
    [/\b(aqu|aquÃ|aqu)\b/g, 'aquí'],
    [/\b(va|vÃa)\b/g, 'vía'],
    [/\b(Sers|SerÃ¡s)\b/g, 'Serás'],
    [/\b(Aadir|AÃ±adir)\b/g, 'Añadir'],
    [/(Â¡Gracias|Gracias)\b/g, '¡Gracias'],
    [/(Â¡No te|No te)\b/g, '¡No te'],
    [/\b(recib|recibÃ)\b/g, 'recibí'],
    [/\b(Diseo|DiseÃ±o)\b/g, 'Diseño'],
    [/\b(cmara|cÃ¡mara)\b/g, 'cámara'],
    [/\b(Cmara|CÃ¡mara)\b/g, 'Cámara'],
    [/\b(Increble|IncreÃble)\b/g, 'Increíble'],
    [/\b(increble|increÃble)\b/g, 'increíble'],
    [/\b(batera|baterÃa)\b/g, 'batería'],
    [/\b(Batera|BaterÃa)\b/g, 'Batería'],
    [/\b(resolucin|resoluciÃ³n)\b/g, 'resolución'],
    [/\b(accin|acciÃ³n)\b/g, 'acción'],
    [/\b(Tambin|TambiÃ©n)\b/g, 'También'],
    [/\b(Ms|MÃ¡s)\b/g, 'Más'],
    [/\b(ms|mÃ¡s)\b/g, 'más'],
    [/\b(Aceptacin|AceptaciÃ³n)\b/g, 'Aceptación'],
    [/\b(Condicin|CondiciÃ³n)\b/g, 'Condición'],
    [/\b(Devolucin|DevoluciÃ³n)\b/g, 'Devolución'],
    [/(Â¿tienes|tienes)\b/g, '¿tienes'],
    [/(Â¿Tienes|Tienes)\b/g, '¿Tienes'],
    [/(Â¿QuÃ©|Qu)\b/g, '¿Qué'],
    [/\b(Da)\b/g, 'Día'],
    [/\b(Das)\b/g, 'Días'],
    [/\b(Catlogo)\b/g, 'Catálogo'],
    [/\b(catlogo)\b/g, 'catálogo'],
    [/\b(BSQUEDA)\b/g, 'BÚSQUEDA'],
    [/\b(Envo)\b/g, 'Envío'],
    [/\b(tecnologa)\b/g, 'tecnología'],
    [/\b(mvil)\b/g, 'móvil'],
    [/\b(garanta)\b/g, 'garantía'],
    [/\b(Garantas)\b/g, 'Garantías'],
    [/\b(Ros)\b/g, 'Ríos'],
    [/\b(Jos)\b/g, 'José'],
    [/\b(Coln)\b/g, 'Colón'],
    [/\b(Sbados)\b/g, 'Sábados'],
    [/\b(Informacin)\b/g, 'Información'],
    [/\b(Trminos)\b/g, 'Términos'],
    [/\b(Polticas)\b/g, 'Políticas'],
    [/\b(dueos)\b/g, 'dueños'],
    [/\b(electrnico)\b/g, 'electrónico'],
    [/\b(Mximo)\b/g, 'Máximo'],
    [/\b(cargarn)\b/g, 'cargarán'],
    [/\b(dinmicamente)\b/g, 'dinámicamente'],
    [/\b(aqu)\b/g, 'aquí'],
    [/\b(va)\b/g, 'vía'],
    [/\b(Sers)\b/g, 'Serás'],
    [/\b(Aadir)\b/g, 'Añadir'],
    [/\b(recib)\b/g, 'recibí'],
    [/\b(Diseo)\b/g, 'Diseño'],
    [/\b(cmara)\b/g, 'cámara'],
    [/\b(Cmara)\b/g, 'Cámara'],
    [/\b(Increble)\b/g, 'Increíble'],
    [/\b(increble)\b/g, 'increíble'],
    [/\b(batera)\b/g, 'batería'],
    [/\b(Batera)\b/g, 'Batería'],
    [/\b(resolucin)\b/g, 'resolución'],
    [/\b(accin)\b/g, 'acción'],
    [/\b(Tambin)\b/g, 'También'],
    [/\b(Ms)\b/g, 'Más'],
    [/\b(ms)\b/g, 'más'],
    [/\b(Aceptacin)\b/g, 'Aceptación'],
    [/\b(Condicin)\b/g, 'Condición'],
    [/\b(Devolucin)\b/g, 'Devolución'],
    [/\uFFFD/g, ''] // Fallback to delete any leftover  to avoid  showing up
];

const files = fs.readdirSync('public').filter(f => f.endsWith('.html') || f.endsWith('.js'));
files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    let modified = false;
    
    replacements.forEach(([regex, replacement]) => {
        if (s.match(regex)) {
            s = s.replace(regex, replacement);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync('public/' + f, s, 'utf8');
        console.log('Repaired ' + f);
    }
});
