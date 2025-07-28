import EntityBase from './EntityBase';

class Car extends EntityBase {
  static defaultAttributes = { name: '', ano: 0, preco: 0 };
}

class Company extends EntityBase {
  static defaultAttributes = { name: '' };
}

class UserEntity extends EntityBase {
  static defaultAttributes = {
    name: '',
    idade: 20,
    company: null,
    carros: []
  };

  static belongsTo = { company: Company };
  static hasMany = { carros: Car };

  static validates = {
    name: [(val) => ({
      isValid: !!val,
      message: 'is required'
    })],
    company: [
      (val, entity) => ({
        isValid: !val || entity.get('idade') >= 18,
        message: 'only allowed for users 18+'
      })
    ]
  };
}

describe('EntityBase', () => {
  describe('instantiation and attributes', () => {
    it('creates an instance with defaults and relationships', () => {
      const user = new UserEntity();

      expect(user.get('name')).toBe('');
      expect(user.get('idade')).toBe(20);
      expect(typeof user.get('_token')).toBe('string');
      expect(user.get('_created_at')).toBeInstanceOf(Date);
      expect(user.get('errors')).toBeDefined();
      expect(user.get('carros')).toBeInstanceOf(Map);
    });

    it('accepts provided values', () => {
      const user = new UserEntity({ name: 'Leo', idade: 20 });
      expect(user.get('name')).toBe('Leo');
      expect(user.get('idade')).toBe(20);
    });
  });

  describe('immutability', () => {
    it('set() returns new instance without modifying original', () => {
      const user = new UserEntity({ name: 'Carlos' });
      const updated = user.set('name', 'Ana');

      expect(updated).not.toBe(user);
      expect(updated.get('name')).toBe('Ana');
      expect(user.get('name')).toBe('Carlos');
    });

    it('returns same instance if value does not change', () => {
      const user = new UserEntity({ name: 'Carlos' });
      const same = user.set('name', 'Carlos');

      expect(same).toBe(user);
    });

    it('updateAttributes updates multiple fields', () => {
      const user = new UserEntity({ name: 'Eva', idade: 40 });
      const updated = user.updateAttributes({ name: 'Eva L.', idade: 41 });

      expect(updated.get('name')).toBe('Eva L.');
      expect(updated.get('idade')).toBe(41);
    });
  });

  describe('belongsTo and hasMany', () => {
    it('updates belongsTo correctly', () => {
      const user = new UserEntity({ name: 'Maria' });
      const updated = user.set('company', { name: 'NovaCo' });

      expect(updated.get('company')).toBeInstanceOf(Company);
      expect(updated.get('company').get('name')).toBe('NovaCo');
    });

    it('preserves other relationships when updating a regular field', () => {
      const user = new UserEntity({
        name: 'Ana',
        company: { name: 'Empresa' },
        carros: [{ name: 'Celta', ano: 2009 }]
      });

      const updated = user.set('idade', 33);

      expect(updated.get('company')).toBe(user.get('company'));
      expect(updated.get('carros')).toBe(user.get('carros'));
    });

    it('updates one car without affecting the others', () => {
      const user = new UserEntity({
        name: 'João',
        carros: [
          { name: 'Civic', preco: 90000 },
          { name: 'Gol', preco: 35000 }
        ]
      });

      const originalCars = user.get('carros');
      const [civicID, golID] = Array.from(originalCars.keys());

      const civic = originalCars.get(civicID);
      const updatedCivic = civic.set('preco', 92000);
      const updatedCars = new Map(originalCars);
      updatedCars.set(civicID, updatedCivic);

      const updatedUser = user.set('carros', updatedCars);

      expect(updatedUser.get('carros')).not.toBe(user.get('carros'));
      expect(updatedUser.get('carros').get(golID)).toBe(originalCars.get(golID));
      expect(updatedUser.get('carros').get(civicID)).not.toBe(civic);
    });
  });

  describe('nested methods', () => {
    it('addNested adds a new item correctly', () => {
      const user = new UserEntity();
      const [userWithCar, newCar] = user.addNested('carros', { name: 'Civic' });

      expect(userWithCar.get('carros').size).toBe(1);
      expect(Array.from(userWithCar.get('carros').values())[0]).toBeInstanceOf(Car);
      expect(newCar.get('name')).toBe('Civic');
    });

    it('updateNested updates an item by key', () => {
      const user = new UserEntity({ carros: [{ name: 'Onix' }] });
      const id = Array.from(user.get('carros').keys())[0];

      const [updatedUser, updatedCar] = user.updateNested('carros', id, { name: 'Onix Plus' });

      expect(updatedCar.get('name')).toBe('Onix Plus');
      expect(updatedUser.get('carros').get(id).get('name')).toBe('Onix Plus');
    });

    it('updateNested throws error for invalid key', () => {
      const user = new UserEntity();
      expect(() => user.updateNested('carros', 'invalid', { name: 'X' })).toThrow();
    });

    it('updateManyNested only applies updates to specified keys', () => {
      const user = new UserEntity({
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

  describe('validation', () => {
    it('validates name and populates errors correctly', () => {
      const user = new UserEntity(); // name is empty
      const validated = user.validate();

      const errors = validated.get('errors');
      expect(errors.isEmpty()).toBe(false);
      expect(errors.fullMessages()[0]).toMatch(/Name is required/);
    });

    it('isValid() returns false if there are errors', () => {
      const user = new UserEntity();
      const validated = user.validate();
      expect(validated.isValid()).toBe(false);
    });

    it('isValid() returns true if there are no errors', () => {
      const user = new UserEntity({ name: 'Bruno' });
      const validated = user.validate();
      expect(validated.isValid()).toBe(true);
    });

    it('should invalidate company if age is under 18', () => {
      const user = new UserEntity({
        name: 'Joãozinho',
        idade: 16,
        company: { name: 'Startup' }
      });

      const validated = user.validate();
      const errors = validated.get('errors');

      expect(errors.isEmpty()).toBe(false);
      expect(errors.messages.company).toContain('only allowed for users 18+');
      expect(errors.fullMessages().some(msg =>
        msg.match(/Company.*18/)
      )).toBe(true);
    });

    it('should accept company if age is 18 or more', () => {
      const user = new UserEntity({
        name: 'Maria',
        idade: 18,
        company: { name: 'DevCorp' }
      });

      const validated = user.validate();
      expect(validated.get('errors').isEmpty()).toBe(true);
    });

    it('should skip company validation if not provided', () => {
      const user = new UserEntity({
        name: 'Lucas',
        idade: 16
      });

      const validated = user.validate();
      expect(validated.get('errors').isEmpty()).toBe(true);
    });
  });

  describe('serialization', () => {
    it('toObject returns flat object with relationships', () => {
      const user = new UserEntity({
        name: 'Lucas',
        idade: 25,
        company: { name: 'Amazônia' },
        carros: [{ name: 'HB20' }]
      });

      const obj = user.toObject();
      expect(obj.company).toBeInstanceOf(Company);
      expect(obj.carros).toBeInstanceOf(Map);
    });

    it('toParams serializes deeply nested values', () => {
      const user = new UserEntity({
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

  describe('utilities and derived properties', () => {
    it('auto-exposes attributes as getters', () => {
      const user = new UserEntity({ name: 'João', idade: 28 });
      expect(user.name).toBe('João');
      expect(user.idade).toBe(28);
    });

    it('auto-exposes relationships as getters', () => {
      const user = new UserEntity({
        company: { name: 'Rocket Inc.' },
        carros: [{ name: 'Tesla' }]
      });

      expect(user.company.name).toBe('Rocket Inc.');
      expect(Array.from(user.carros.values())[0].name).toBe('Tesla');
    });

    it('idOrToken returns token or id', () => {
      const user = new UserEntity({ id: 55 });
      expect(user.idOrToken).toBe(55);

      const user2 = new UserEntity();
      expect(typeof user2.idOrToken).toBe('string');
    });

    it('isNewEntity and isPersisted return correct values', () => {
      const user = new UserEntity();
      const persisted = new UserEntity({ id: 10 });

      expect(user.isNewEntity()).toBe(true);
      expect(user.isPersisted()).toBe(false);
      expect(persisted.isNewEntity()).toBe(false);
      expect(persisted.isPersisted()).toBe(true);
    });
  });
});
