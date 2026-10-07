import { Button, Logo, Screen } from './ui.jsx';
import { IconArrowLeft } from './Icons.jsx';

const STEPS = [
  {
    title: 'Identificação do paciente',
    text: 'Os dados básicos do idoso são cadastrados uma única vez e ficam disponíveis para toda a equipe.',
  },
  {
    title: 'Avaliação de cada especialidade',
    text: 'Cada profissional registra a sua parte: saúde física, saúde mental, nutrição, autocuidado e condições sociais.',
  },
  {
    title: 'Encaminhamento adequado',
    text: 'Com a ficha completa, a equipe define o acolhimento institucional mais apropriado ao perfil de cada paciente.',
  },
];

/**
 * Apresentação do aplicativo (tela de primeiro acesso, "/sobre" e boas-vindas após o cadastro).
 * greeting: título personalizado (boas-vindas); onBack: mostra a seta de voltar.
 *
 * Celular: logo, foto, texto, botão e "Como funciona" empilhados.
 * Telas grandes: barra no topo, destaque com foto e texto lado a lado e "Como funciona" em 3 cartões.
 */
export default function About({ greeting, onStart, onBack, startLabel = 'Começar agora' }) {
  return (
    <Screen className="about">
      <header className="about__top">
        {onBack && (
          <button className="icon-btn about__back" aria-label="Voltar" title="Voltar" onClick={onBack}><IconArrowLeft /></button>
        )}
        <Logo size="xl" />
        <Button className="about__top-btn" onClick={onStart} title="Começar a usar o DesospIdoso">{startLabel}</Button>
      </header>

      <section className="about__hero">
        <figure className="about__media">
          <img
            src="/img/home.jpg"
            width="1200"
            height="801"
            alt="Profissional de saúde caminhando abraçada a uma senhora idosa em um jardim"
          />
        </figure>

        <div className="about__intro">
          <p className="about__eyebrow">Hospital e Maternidade Dra. Zilda Arns Neumann</p>
          <h1 className="about__title">{greeting || 'Cuidado que continua depois da alta'}</h1>
          <p className="about__lead">
            O DesospIdoso ajuda a equipe a identificar, ainda durante a internação, os pacientes idosos que vão
            precisar de acolhimento em uma instituição de longa permanência, pública ou conveniada, após a alta
            hospitalar.
          </p>
          <p className="about__cta">Comece agora e contribua para um atendimento mais rápido, humanizado e eficiente.</p>
          <Button onClick={onStart} title="Começar a usar o DesospIdoso">{startLabel}</Button>
        </div>
      </section>

      <section className="about__how" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="about__subtitle">Como funciona</h2>
        <ol className="about__steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="about__num" aria-hidden="true">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </Screen>
  );
}
