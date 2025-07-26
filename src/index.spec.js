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
    idade: 20,
    company: null,
    carros: []
  };

  static belongsTo = { company: Company };
  static hasMany = { carros: Carro };

  static validates = {
    name: [(val) => ({
      isValid: !!val,
      message: 'é obrigatório'
    })],
    company: [
      (val, record) => ({
        isValid: !val || record.get('idade') >= 18,
        message: 'é permitido apenas para pessoas maiores de 18 anos'
      })
    ]
  };
}

describe('RecordBase', () => {
  describe('instanciação e atributos', () => {
    it('instancia com defaults e relacionamentos corretos', () => {
      const user = new UserRecord();

      expect(user.get('name')).toBe('');
      expect(user.get('idade')).toBe(20);
      expect(typeof user.get('_token')).toBe('string');
      expect(user.get('_created_at')).toBeInstanceOf(Date);
      expect(user.get('errors')).toBeDefined();
      expect(user.get('carros')).toBeInstanceOf(Map);
    });

    it('usa valores passados corretamente', () => {
      const user = new UserRecord({ name: 'Léo', idade: 20 });
      expect(user.get('name')).toBe('Léo');
      expect(user.get('idade')).toBe(20);
    });
  });

  describe('imutabilidade', () => {
    it('não altera original com set()', () => {
      const user = new UserRecord({ name: 'Carlos' });
      const updated = user.set('name', 'Ana');

      expect(updated).not.toBe(user);
      expect(updated.get('name')).toBe('Ana');
      expect(user.get('name')).toBe('Carlos');
    });

    it('retorna mesmo objeto se valor não muda', () => {
      const user = new UserRecord({ name: 'Carlos' });
      const same = user.set('name', 'Carlos');

      expect(same).toBe(user);
    });

    it('updateAttributes altera múltiplos atributos', () => {
      const user = new UserRecord({ name: 'Eva', idade: 40 });
      const updated = user.updateAttributes({ name: 'Eva L.', idade: 41 });

      expect(updated.get('name')).toBe('Eva L.');
      expect(updated.get('idade')).toBe(41);
    });
  });

  describe('belongsTo e hasMany', () => {
    it('atualiza belongsTo corretamente', () => {
      const user = new UserRecord({ name: 'Maria' });
      const updated = user.set('company', { name: 'NovaCo' });

      expect(updated.get('company')).toBeInstanceOf(Company);
      expect(updated.get('company').get('name')).toBe('NovaCo');
    });

    it('preserva outros relacionamentos ao alterar campo comum', () => {
      const user = new UserRecord({
        name: 'Ana',
        company: { name: 'Empresa' },
        carros: [{ name: 'Celta', ano: 2009 }]
      });

      const updated = user.set('idade', 33);

      expect(updated.get('company')).toBe(user.get('company'));
      expect(updated.get('carros')).toBe(user.get('carros'));
    });

    it('altera um carro sem afetar os outros', () => {
      const user = new UserRecord({
        name: 'João',
        carros: [
          { name: 'Civic', preco: 90000 },
          { name: 'Gol', preco: 35000 }
        ]
      });

      const originalCarros = user.get('carros');
      const [civicID, golID] = Array.from(originalCarros.keys());

      const civic = originalCarros.get(civicID);
      const novoCivic = civic.set('preco', 92000);
      const novosCarros = new Map(originalCarros);
      novosCarros.set(civicID, novoCivic);

      const updatedUser = user.set('carros', novosCarros);

      expect(updatedUser.get('carros')).not.toBe(user.get('carros'));
      expect(updatedUser.get('carros').get(golID)).toBe(originalCarros.get(golID));
      expect(updatedUser.get('carros').get(civicID)).not.toBe(civic);
    });
  });

  describe('nested methods', () => {
    it('addNested adiciona item corretamente', () => {
      const user = new UserRecord();
      const [userWithCar, newCar] = user.addNested('carros', { name: 'Civic' });

      expect(userWithCar.get('carros').size).toBe(1);
      expect(Array.from(userWithCar.get('carros').values())[0]).toBeInstanceOf(Carro);
      expect(newCar.get('name')).toBe('Civic');
    });

    it('updateNested atualiza item corretamente', () => {
      const user = new UserRecord({ carros: [{ name: 'Onix' }] });
      const id = Array.from(user.get('carros').keys())[0];

      const [updatedUser, updatedCar] = user.updateNested('carros', id, { name: 'Onix Plus' });

      expect(updatedCar.get('name')).toBe('Onix Plus');
      expect(updatedUser.get('carros').get(id).get('name')).toBe('Onix Plus');
    });

    it('updateNested lança erro se chave inválida', () => {
      const user = new UserRecord();
      expect(() => user.updateNested('carros', 'invalid', { name: 'X' })).toThrow();
    });

    it('updateManyNested aplica mudanças apenas a chaves indicadas', () => {
      const user = new UserRecord({
        carros: [
          { name: 'Gol', preco: 30 },
          { name: 'Uno', preco: 40 }
        ]
      });

      const keys = Array.from(user.get('carros').keys());
      const [updatedUser, updatedList] = user.updateManyNested('carros', { preco: 99 }, [keys[0]]);

      expect(updatedList.length).toBe(1);
      expect(updatedUser.get('carros').get(keys[0]).get('preco')).toBe(99);
      expect(updatedUser.get('carros').get(keys[1]).get('preco')).toBe(40);
    });
  });

  describe('validações', () => {
    it('valida name e preenche erros corretamente', () => {
      const user = new UserRecord(); // name vazio
      const validated = user.validate();

      const errors = validated.get('errors');
      expect(errors.isEmpty()).toBe(false);
      expect(errors.fullMessages()[0]).toMatch(/Name é obrigatório/);
    });

    it('isValid() retorna false se houver erros', () => {
      const user = new UserRecord();
      const validated = user.validate();
      expect(validated.isValid()).toBe(false);
    });

    it('isValid() retorna true se não houver erros', () => {
      const user = new UserRecord({ name: 'Bruno' });
      const validated = user.validate();
      expect(validated.isValid()).toBe(true);
    });

    it('deve invalidar company para idade menor que 18', () => {
      const user = new UserRecord({
        name: 'Joãozinho',
        idade: 16,
        company: { name: 'Startup' }
      });

      const validated = user.validate();
      const errors = validated.get('errors');

      expect(errors.isEmpty()).toBe(false);
      expect(errors.messages.company).toContain('é permitido apenas para pessoas maiores de 18 anos');
      expect(errors.fullMessages().some(msg =>
        msg.match(/Company.*maiores de 18/)
      )).toBe(true);
    });

    it('deve aceitar company se idade for 18 ou mais', () => {
      const user = new UserRecord({
        name: 'Maria',
        idade: 18,
        company: { name: 'DevCorp' }
      });

      const validated = user.validate();
      expect(validated.get('errors').isEmpty()).toBe(true);
    });

    it('não deve validar company se não estiver presente', () => {
      const user = new UserRecord({
        name: 'Lucas',
        idade: 16 // idade baixa, mas sem company
      });

      const validated = user.validate();
      expect(validated.get('errors').isEmpty()).toBe(true);
    });
  });

  describe('serialização', () => {
    it('toObject retorna objeto plano com relações', () => {
      const user = new UserRecord({
        name: 'Lucas',
        idade: 25,
        company: { name: 'Amazônia' },
        carros: [{ name: 'HB20' }]
      });

      const obj = user.toObject();
      expect(obj.company).toBeInstanceOf(Company);
      expect(obj.carros).toBeInstanceOf(Map);
    });

    it('toParams serializa com profundidade', () => {
      const user = new UserRecord({
        name: 'Luana',
        idade: 30,
        company: { name: 'Tech' },
        carros: [{ name: 'Fiesta' }]
      });

      const params = user.toParams();

      expect(params.name).toBe('Luana');
      expect(params.company).toHaveProperty('name', 'Tech');
      expect(Array.isArray(params.carros)).toBe(true);
      expect(params.carros[0]).toHaveProperty('name', 'Fiesta');
    });
  });

  describe('utilitários e propriedades derivadas', () => {
    it('expõe getters automáticos', () => {
      const user = new UserRecord({ name: 'João', idade: 28 });
      expect(user.name).toBe('João');
      expect(user.idade).toBe(28);
    });

    it('expõe relacionamentos como getters', () => {
      const user = new UserRecord({
        company: { name: 'Rocket Inc.' },
        carros: [{ name: 'Tesla' }]
      });

      expect(user.company.name).toBe('Rocket Inc.');
      expect(Array.from(user.carros.values())[0].name).toBe('Tesla');
    });

    it('idOrToken deve retornar token ou id', () => {
      const user = new UserRecord({ id: 55 });
      expect(user.idOrToken).toBe(55);

      const user2 = new UserRecord();
      expect(typeof user2.idOrToken).toBe('string');
    });

    it('isNewRecord e isPersisted funcionam corretamente', () => {
      const user = new UserRecord();
      const persisted = new UserRecord({ id: 10 });

      expect(user.isNewRecord()).toBe(true);
      expect(user.isPersisted()).toBe(false);
      expect(persisted.isNewRecord()).toBe(false);
      expect(persisted.isPersisted()).toBe(true);
    });
  });
});
