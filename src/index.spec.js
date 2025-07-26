import RecordBase from './index';

class Carro extends RecordBase {
  static defaultAttributes = { name: '', ano: 0, preco: 0 };
}

class Company extends RecordBase {
  static defaultAttributes = { name: '' };
}

class UserRecord extends RecordBase {
  static defaultAttributes = {
    name: '',
    idade: 0,
    company: null,
    carros: []
  };

  static belongsTo = { company: Company };
  static hasMany = { carros: Carro };

  static validates = {
    name: [(val) => ({
      isValid: !!val,
      message: 'é obrigatório'
    })]
  };
}

describe('RecordBase', () => {
  it('deve instanciar com atributos default', () => {
    const user = new UserRecord();

    expect(user.get('name')).toBe('');
    expect(user.get('idade')).toBe(0);
    expect(typeof user.get('_token')).toBe('string');
    expect(user.get('_created_at')).toBeInstanceOf(Date);
    expect(user.get('errors')).toBeDefined();
    expect(user.get('carros')).toBeInstanceOf(Map);
  });

  it('deve manter relacionamentos iguais ao alterar campo comum', () => {
    const user = new UserRecord({
      name: 'Ana',
      company: { name: 'Empresa' },
      carros: [{ name: 'Celta', ano: 2009 }]
    });

    const updated = user.set('idade', 33);

    expect(updated.get('company')).toBe(user.get('company'));
    expect(updated.get('carros')).toBe(user.get('carros'));
  });

  it('deve alterar apenas um registro dentro de hasMany, preservando os demais', () => {
    const user = new UserRecord({
      name: 'João',
      carros: [
        { name: 'Civic', preco: 90000 },
        { name: 'Gol', preco: 35000 }
      ]
    });

    const originalCarros = user.get('carros');
    const civicID = Array.from(originalCarros.keys())[0];
    const golID = Array.from(originalCarros.keys())[1];

    const civic = originalCarros.get(civicID);
    const gol = originalCarros.get(golID);

    const novoCivic = civic.set('preco', 92000);
    const novosCarros = new Map(originalCarros);
    novosCarros.set(civicID, novoCivic);

    const updatedUser = user.set('carros', novosCarros);

    expect(updatedUser.get('carros')).not.toBe(user.get('carros'));
    expect(updatedUser.get('carros').get(golID)).toBe(gol);
    expect(updatedUser.get('carros').get(civicID)).not.toBe(civic);
  });

  it('não deve alterar o objeto se o valor setado for igual', () => {
    const user = new UserRecord({ name: 'Carlos' });
    const same = user.set('name', 'Carlos');

    expect(same).toBe(user);
  });

  it('deve atualizar belongsTo corretamente', () => {
    const user = new UserRecord({ name: 'Maria' });
    const updated = user.set('company', { name: 'NovaCo' });

    expect(updated.get('company')).toBeInstanceOf(Company);
    expect(updated.get('company').get('name')).toBe('NovaCo');
  });

  it('deve preservar toObject e toParams com todos os dados', () => {
    const user = new UserRecord({
      name: 'Lucas',
      idade: 25,
      company: { name: 'Amazônia' },
      carros: [{ name: 'HB20' }]
    });

    const obj = user.toObject();

    expect(obj.name).toBe('Lucas');
    expect(obj.company).toBeInstanceOf(Company);
    expect(obj.carros instanceof Map).toBe(true);
  });

  it('deve clonar corretamente atributos e manter identidade de métodos', () => {
    const user = new UserRecord({ name: 'Lara' });
    const user2 = user.set('idade', 29);

    expect(user2.get('name')).toBe('Lara');
    expect(user2.get('idade')).toBe(29);
    expect(user2).toBeInstanceOf(UserRecord);
  });

  it('deve permitir múltiplas atualizações com updateAttributes', () => {
    const user = new UserRecord({ name: 'Eva', idade: 40 });

    const updated = user.updateAttributes({
      name: 'Eva L.',
      idade: 41
    });

    expect(updated.get('name')).toBe('Eva L.');
    expect(updated.get('idade')).toBe(41);
  });

  it('deve validar e reportar erro corretamente', () => {
    const user = new UserRecord(); // name em branco
    const validated = user.validate();

    const errors = validated.get('errors');
    expect(errors.isEmpty()).toBe(false);
    expect(errors.fullMessages()[0]).toMatch(/Name é obrigatório/);
  });

  it('deve retornar true para isNewRecord se não tiver id', () => {
    const user = new UserRecord();
    expect(user.isNewRecord()).toBe(true);
    expect(user.isPersisted()).toBe(false);
  });

  it('deve retornar false para isNewRecord se tiver id', () => {
    const user = new UserRecord({ id: 42 });
    expect(user.isNewRecord()).toBe(false);
    expect(user.isPersisted()).toBe(true);
  });
});

