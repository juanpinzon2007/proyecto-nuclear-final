import { ClinicalCase, Scenario } from './models';

export const CASES: ClinicalCase[] = [
  {
    id: 'caso-violencia-familiar-001',
    reference: 'CASO-PS-001',
    name: 'Violencia familiar y tentativa de feminicidio',
    subject: 'Sobreviviente y familia',
    status: 'volatile',
    complexity: 4,
    location: 'Hospital de urgencias y Comisaría de Familia',
    summary: 'Una mujer de 22 años sobrevive a un ataque con arma cortopunzante. Su hija de 3 años fallece en el hecho. El estudiante debe responder técnica y éticamente en urgencia hospitalaria y, posteriormente, en Comisaría de Familia.',
    objectives: [
      'Priorizar la intervención psicológica inmediata en una urgencia vital y crisis familiar.',
      'Reconocer el marco normativo aplicable a violencias basadas en género y medidas de protección.',
      'Evitar prácticas revictimizantes durante la valoración psicosocial.',
      'Aplicar criterios técnicos para duelo traumático, riesgo de feminicidio y activación de rutas.'
    ],
    warning: 'violencia familiar, tentativa de feminicidio, muerte de una niña, duelo traumático y lesiones graves.'
  }
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'hospital-q1',
    label: 'Escenario 1 / Pregunta 1',
    location: 'Hospital - urgencia vital y crisis',
    title: '¿En qué centrar la intervención inmediata?',
    body: 'La sobreviviente está en shock hipovolémico y emocional. La madre y los hermanos llegan alterados, exigiendo ver a la niña fallecida, aunque todavía no tienen confirmación clara.',
    stress: 92,
    volatility: 'CRÍTICA',
    next: 'hospital-q2',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Notificar de inmediato', body: 'Notificar a la madre y la familia sobre la muerte de la niña de inmediato.', tone: 'amber', xp: 12, feedback: 'Informar sin preparación puede intensificar la crisis. La noticia debe darse con protocolo, contención y condiciones mínimas de seguridad emocional.' },
      { id: 'b', style: 'Opción B', title: 'Contención y PAP', body: 'Centrar la intervención en contención emocional, acompañamiento en duelo inicial y estabilización de crisis mediante Primeros Auxilios Psicológicos.', tone: 'green', xp: 28, feedback: 'Respuesta adecuada. En urgencia vital se prioriza estabilización, contención y preparación para comunicar información crítica sin aumentar el daño.' },
      { id: 'c', style: 'Opción C', title: 'Interrogar a la víctima', body: 'Interrogar a la víctima herida para obtener detalles del agresor antes de que entre a cirugía.', tone: 'amber', xp: 8, feedback: 'Esta acción es revictimizante y clínicamente inoportuna. La víctima requiere atención médica urgente y protección, no interrogatorio.' }
    ]
  },
  {
    id: 'hospital-q2',
    label: 'Escenario 1 / Pregunta 2',
    location: 'Hospital - marco normativo',
    title: '¿Qué marco normativo y técnico debe seguir?',
    body: 'El caso exige reconocer protocolos de atención integral y normas de protección frente a violencia basada en género.',
    stress: 84,
    volatility: 'ALTA',
    next: 'hospital-q3',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Resolución 459 de 2012', body: 'Aplicar únicamente la Resolución 459 de 2012.', tone: 'amber', xp: 14, feedback: 'Es pertinente, pero incompleta para el abordaje integral de violencia contra la mujer.' },
      { id: 'b', style: 'Opción B', title: 'Resolución 459 y Ley 1257', body: 'Aplicar la Resolución 459 de 2012 y la Ley 1257 de 2008.', tone: 'green', xp: 28, feedback: 'Respuesta adecuada. Integra atención en salud y marco de prevención, sanción y protección frente a violencia contra las mujeres.' },
      { id: 'c', style: 'Opción C', title: 'Resolución 459 y Ley 1448', body: 'Aplicar la Resolución 459 de 2012 y la Ley 1448 de 2011.', tone: 'amber', xp: 10, feedback: 'La Ley 1448 puede relacionarse con víctimas del conflicto armado, pero no es el eje normativo principal de este caso hospitalario.' }
    ]
  },
  {
    id: 'hospital-q3',
    label: 'Escenario 1 / Pregunta 3',
    location: 'Hospital - actuación técnica y ética',
    title: '¿Qué se debe hacer y qué se debe evitar?',
    body: 'La intervención debe proteger a la sobreviviente, contener a la familia y preparar la comunicación del fallecimiento de la niña.',
    stress: 88,
    volatility: 'CRÍTICA',
    next: 'comisaria-q1',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Explorar antecedentes de pareja', body: 'Escucha activa sin juicios, intervenir disonancia cognitiva, preguntar antecedentes de la relación y activar psicología clínica y psiquiatría.', tone: 'amber', xp: 12, feedback: 'Tiene elementos útiles, pero omite el manejo del duelo traumático familiar y la comunicación protocolizada del fallecimiento.' },
      { id: 'b', style: 'Opción B', title: 'PAP y protocolo EPICEE', body: 'Primeros Auxilios Psicológicos para la familia, escucha activa a la víctima cuando esté consciente y protocolo EPICEE para informar el fallecimiento.', tone: 'amber', xp: 20, feedback: 'Es pertinente, aunque queda corta frente a la valoración psicosocial e intervención interdisciplinar.' },
      { id: 'c', style: 'Opción C', title: 'PAP, EPICEE y ciclo de violencia', body: 'PAP, escucha activa, protocolo EPICEE, preguntas sobre antecedentes para determinar ciclo de violencia y manejo interdisciplinar.', tone: 'amber', xp: 22, feedback: 'Buena ruta, pero preguntar por antecedentes debe hacerse cuando la víctima esté en condiciones y sin desplazar la evaluación familiar del duelo.' },
      { id: 'd', style: 'Opción D', title: 'Ruta integral y no revictimizante', body: 'PAP para la familia, escucha activa sin juicios a la víctima cuando esté consciente, protocolo EPICEE, evaluación psicosocial de factores protectores y de riesgo, y manejo interdisciplinar.', tone: 'green', xp: 32, feedback: 'Respuesta más completa. Integra crisis, duelo, seguridad, no revictimización y toma de decisiones interdisciplinar.' }
    ]
  },
  {
    id: 'comisaria-q1',
    label: 'Escenario 2 / Pregunta 1',
    location: 'Comisaría de Familia - restablecimiento de derechos',
    title: '¿Cuál es la prioridad en la asesoría psicosocial?',
    body: 'Han pasado 15 días. La mujer fue dada de alta, presenta secuelas físicas y trauma complejo. Se debe definir medida de protección y apoyo psicológico a largo plazo.',
    stress: 78,
    volatility: 'ALTA',
    next: 'comisaria-q2',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Mediación y perdón', body: 'Instar a la mujer para que escuche al agresor en pro de la unión familiar y el perdón.', tone: 'amber', xp: 4, feedback: 'Es inadecuado. La mediación en violencia de pareja puede aumentar el riesgo y responsabilizar a la víctima.' },
      { id: 'b', style: 'Opción B', title: 'Riesgo y protección', body: 'Valorar riesgo de feminicidio, activar medidas de protección y asesorar sobre derechos económicos y de justicia.', tone: 'green', xp: 30, feedback: 'Respuesta adecuada. La prioridad es seguridad, protección, derechos y continuidad de atención.' },
      { id: 'c', style: 'Opción C', title: 'Psicoterapia de elección de pareja', body: 'Realizar psicoterapia para encontrar patrones de infancia que desencadenan su elección de pareja.', tone: 'amber', xp: 6, feedback: 'Desplaza la responsabilidad hacia la víctima y no responde a la urgencia de protección y restablecimiento de derechos.' }
    ]
  },
  {
    id: 'comisaria-q2',
    label: 'Escenario 2 / Pregunta 2',
    location: 'Comisaría de Familia - marco normativo',
    title: '¿Qué marco normativo y técnico debe seguir?',
    body: 'La Comisaría debe orientar medidas de protección, restablecimiento de derechos y respuesta frente a violencia contra la mujer.',
    stress: 70,
    volatility: 'MEDIA',
    next: 'comisaria-q3',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Ley 2126, Ley 1098 y Ley 1257', body: 'Aplicar Ley 2126 de 2021, Ley 1098 de 2006 y Ley 1257 de 2008.', tone: 'green', xp: 30, feedback: 'Respuesta adecuada. Integra funciones de Comisarías, protección de niños, niñas y adolescentes, y violencia contra las mujeres.' },
      { id: 'b', style: 'Opción B', title: 'Ley 1098 y Ley 1257', body: 'Aplicar Ley 1098 de 2006 y Ley 1257 de 2008.', tone: 'amber', xp: 18, feedback: 'Es pertinente, pero incompleta porque omite la Ley 2126 de 2021 sobre Comisarías de Familia.' },
      { id: 'c', style: 'Opción C', title: 'Ley 1098, Ley 1257 y Ley 1148', body: 'Aplicar Ley 1098 de 2006, Ley 1257 de 2008 y Ley 1148 de 2011.', tone: 'amber', xp: 8, feedback: 'No es la combinación normativa más precisa para este escenario de Comisaría.' }
    ]
  },
  {
    id: 'comisaria-q3',
    label: 'Escenario 2 / Pregunta 3',
    location: 'Comisaría de Familia - actuación técnica y ética',
    title: '¿Qué se debe hacer y qué se debe evitar?',
    body: 'La asesoría debe valorar el estado emocional, dependientes o personas vulnerables, riesgo de vulneración de derechos y rutas de atención.',
    stress: 82,
    volatility: 'ALTA',
    next: 'reflection',
    decisions: [
      { id: 'a', style: 'Opción A', title: 'Escucha y riesgo de feminicidio', body: 'Escucha activa sin juicios, intervenir disonancia cognitiva, explorar antecedentes, valorar riesgo de feminicidio y activar psicología clínica y psiquiatría.', tone: 'amber', xp: 20, feedback: 'Contiene elementos útiles, pero reduce la ruta a salud mental y no desarrolla suficientemente restablecimiento de derechos.' },
      { id: 'b', style: 'Opción B', title: 'Valoración inicial y derivación', body: 'Realizar valoración psicológica y emocional de la víctima y personas dependientes, escucha activa, explorar antecedentes y activar salud y salud mental si es necesario.', tone: 'amber', xp: 22, feedback: 'Es una respuesta pertinente, pero falta establecer nivel de riesgo de vulneración de derechos y riesgo de feminicidio.' },
      { id: 'c', style: 'Opción C', title: 'Valoración integral de riesgo y derechos', body: 'Valorar psicológica y emocionalmente a la víctima y dependientes, establecer riesgo de vulneración de derechos, aplicar valoración de riesgo de feminicidio y activar rutas de salud y salud mental.', tone: 'green', xp: 32, feedback: 'Respuesta más completa. Integra valoración psicosocial, derechos, riesgo de feminicidio y rutas de atención sin revictimizar.' }
    ]
  }
];

export const COMPETENCIES = [
  { name: 'Primeros Auxilios Psicológicos', score: 88, color: 'var(--cyan)' },
  { name: 'Marco normativo', score: 84, color: 'var(--green)' },
  { name: 'Valoración del riesgo', score: 91, color: 'var(--amber)' },
  { name: 'Ética y no revictimización', score: 94, color: 'var(--green)' }
];
