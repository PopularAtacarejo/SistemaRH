import { Candidate } from '../types/candidate';

export const generateMockCandidates = (): Candidate[] => {
  const names = [
    'Ana Silva Santos', 'Carlos Eduardo Oliveira', 'Mariana Costa Lima',
    'João Pedro Almeida', 'Fernanda Rodrigues', 'Rafael Henrique Santos',
    'Juliana Ferreira', 'Bruno Machado', 'Camila Sousa', 'Diego Martins',
    'Priscila Barbosa', 'Thiago Nascimento', 'Larissa Pereira', 'André Luiz Costa',
    'Beatriz Andrade', 'Lucas Gabriel Silva', 'Amanda Ribeiro', 'Felipe Santos',
    'Natália Gomes', 'Rodrigo Araújo'
  ];

  const positions = [
    'Desenvolvedor Frontend',
    'Desenvolvedor Backend',
    'Analista de Sistemas',
    'Designer UI/UX',
    'Gerente de Projetos',
    'Analista de Marketing',
    'Contador',
    'Assistente Administrativo',
    'Vendedor',
    'Atendente'
  ];

  const cities = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília',
    'Salvador', 'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia'
  ];

  const statuses = [
    'em_analise',
    'chamando_entrevista',
    'na_experiencia',
    'fazer_cracha',
    'primeira_prova',
    'segunda_prova',
    'aprovado_experiencia',
    'reprovado'
  ];

  const experiences = [
    '3 anos de experiência em desenvolvimento web com React e Node.js',
    '5 anos trabalhando em empresas de tecnologia com foco em backend',
    'Recém formado em Ciência da Computação, estagiou em startup',
    '2 anos de experiência em design, especializado em interfaces mobile',
    '7 anos de experiência em gestão de projetos ágeis',
    '4 anos em marketing digital e redes sociais',
    '6 anos de experiência contábil em empresas de médio porte',
    '1 ano de experiência administrativa, cursando Administração',
    '3 anos de experiência em vendas no varejo',
    '2 anos trabalhando com atendimento ao cliente'
  ];

  return names.map((name, index) => {
    const applicationDate = new Date();
    applicationDate.setDate(applicationDate.getDate() - Math.floor(Math.random() * 30));
    
    const lastUpdate = new Date();
    lastUpdate.setDate(lastUpdate.getDate() - Math.floor(Math.random() * 7));

    return {
      id: (index + 1).toString(),
      name,
      email: name.toLowerCase().replace(/\s+/g, '.') + '@email.com',
      phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      applicationDate: applicationDate.toISOString(),
      lastUpdate: lastUpdate.toISOString(),
      updatedBy: 'Sistema',
      resumeUrl: `https://example.com/curriculo-${index + 1}.pdf`,
      experience: experiences[Math.floor(Math.random() * experiences.length)],
      comments: [
        {
          id: '1',
          text: 'Candidato com bom perfil técnico, recomendo entrevista.',
          author: 'João Silva - RH',
          date: lastUpdate.toISOString(),
          type: 'comment' as const
        }
      ]
    };
  });
};