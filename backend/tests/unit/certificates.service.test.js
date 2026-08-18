jest.mock('../../src/modules/certificates/repository', () => ({
  getTemplates: jest.fn(),
}));

jest.mock('../../src/services/aiProviderService', () => ({
  generate: jest.fn(),
}));

const repo = require('../../src/modules/certificates/repository');
const aiProvider = require('../../src/services/aiProviderService');
const service = require('../../src/modules/certificates/service');

describe('Certificate Service - suggestTemplate', () => {
  const templates = [
    { id: 1, name: 'Certificate of Excellence' },
    { id: 2, name: 'Internship Completion' },
    { id: 3, name: 'Participation' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repo.getTemplates.mockResolvedValue(templates);
  });

  it('returns the matching template when AI returns valid JSON', async () => {
    aiProvider.generate.mockResolvedValue(
      '{"templateName":"Internship Completion"}'
    );

    const result = await service.suggestTemplate({
      achievement: 'Completed internship successfully',
      type: 'completion',
    });

    expect(result).toEqual(templates[1]);
  });

  it('falls back to the first template when AI response contains explanation text', async () => {
    aiProvider.generate.mockResolvedValue(
      'The best template is "Internship Completion" because it matches the achievement.'
    );

    const result = await service.suggestTemplate({
      achievement: 'Completed internship successfully',
      type: 'completion',
    });

    expect(result).toEqual(templates[0]);
  });

  it('falls back to the first template when AI returns invalid JSON', async () => {
    aiProvider.generate.mockResolvedValue('not valid json');

    const result = await service.suggestTemplate({
      achievement: 'Completed internship successfully',
      type: 'completion',
    });

    expect(result).toEqual(templates[0]);
  });

  it('falls back to the first template when AI returns an unknown template name', async () => {
    aiProvider.generate.mockResolvedValue(
      '{"templateName":"Unknown Template"}'
    );

    const result = await service.suggestTemplate({
      achievement: 'Completed internship successfully',
      type: 'completion',
    });

    expect(result).toEqual(templates[0]);
  });
});
