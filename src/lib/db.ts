
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import path from 'path';

const storage = path.join(process.cwd(), 'db.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: false, 
});

// --- User Model ---
interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  name?: string;
  address?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  whatsapp?: string;
  phone?: string;
  photo?: string;
  university?: string;
  isAdmin: boolean;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public name?: string;
  public address?: string;
  public gender?: 'Laki-laki' | 'Perempuan';
  public whatsapp?: string;
  public phone?: string;
  public photo?: string;
  public university?: string;
  public isAdmin!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
User.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  name: DataTypes.STRING,
  address: DataTypes.STRING,
  gender: DataTypes.ENUM('Laki-laki', 'Perempuan'),
  whatsapp: DataTypes.STRING,
  phone: DataTypes.STRING,
  photo: DataTypes.TEXT,
  university: DataTypes.STRING,
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, { sequelize, modelName: 'User' });


// --- Quiz Model ---
interface QuizAttributes {
  id: number;
  slug: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimitSeconds: number;
}
interface QuizCreationAttributes extends Optional<QuizAttributes, 'id'> {}
export class Quiz extends Model<QuizAttributes, QuizCreationAttributes> implements QuizAttributes {
  public id!: number;
  public slug!: string;
  public title!: string;
  public description!: string;
  public passingScore!: number;
  public timeLimitSeconds!: number;
  public readonly questions?: Question[];
}
Quiz.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  passingScore: { type: DataTypes.INTEGER, allowNull: false },
  timeLimitSeconds: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'Quiz' });


// --- Question Model ---
interface QuestionAttributes {
  id: number;
  quizId: number;
  questionText: string;
  options: string; // JSON stringified array
  correctAnswer: string;
}
interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id'> {}
export class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public id!: number;
  public quizId!: number;
  public questionText!: string;
  public options!: string;
  public correctAnswer!: string;
}
Question.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quizId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Quizzes', key: 'id' } },
  questionText: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.TEXT, allowNull: false }, // Stored as a JSON string
  correctAnswer: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: 'Question' });


// --- QuizAttempt Model ---
interface QuizAttemptAttributes {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  passed: boolean;
  answers: string; // JSON stringified object
  submittedAt: Date;
}
interface QuizAttemptCreationAttributes extends Optional<QuizAttemptAttributes, 'id'> {}
export class QuizAttempt extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes> implements QuizAttemptAttributes {
  public id!: number;
  public userId!: number;
  public quizId!: number;
  public score!: number;
  public passed!: boolean;
  public answers!: string;
  public submittedAt!: Date;
  public readonly user?: User;
  public readonly quiz?: Quiz;
}
QuizAttempt.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  quizId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Quizzes', key: 'id' } },
  score: { type: DataTypes.FLOAT, allowNull: false },
  passed: { type: DataTypes.BOOLEAN, allowNull: false },
  answers: { type: DataTypes.TEXT, allowNull: false }, // Stored as a JSON string
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { sequelize, modelName: 'QuizAttempt' });


// --- Associations ---
Quiz.hasMany(Question, { as: 'questions', foreignKey: 'quizId', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quizId' });

User.hasMany(QuizAttempt, { as: 'attempts', foreignKey: 'userId', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(User, { as: 'user', foreignKey: 'userId' });

Quiz.hasMany(QuizAttempt, { as: 'attempts', foreignKey: 'quizId', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { as: 'quiz', foreignKey: 'quizId' });


export { sequelize };
