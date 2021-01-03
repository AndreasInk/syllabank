import { mocked } from 'ts-jest/utils';
import { testEnv } from './utils/firebaseHelper';
import { registerSyllabi } from '../src/functions/registerSyllabi';
import * as courseRepo from '../src/repositories/courseRepo';
import * as syllabusRepo from '../src/repositories/syllabusRepo';

jest.mock('../src/repositories/courseRepo.ts', () => ({
  findCourse: jest.fn(),
  saveCourse: jest.fn(),
}));

jest.mock('../src/repositories/syllabusRepo.ts', () => ({
  publishSyllabus: jest.fn(),
}));

const mockedCourseRepo = mocked(courseRepo);
const mockedSyllabusRepo = mocked(syllabusRepo);

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
  mocked(console.log).mockRestore();
  mocked(console.error).mockRestore();
});

describe('registerSyllabi', () => {
  test('should skip files that are not PDFs', async () => {
    // Arrange
    const object = {
      name: 'syllabi/AST2002_Spring2017_Anderson.pdf',
      bucket: 'syllabank.appspot.com',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      metageneration: 0,
      timeCreated: new Date(),
      updated: new Date(),
    };
    const wrapped = testEnv.wrap(registerSyllabi);

    // Act
    await wrapped(object);

    // Assert
    expect(mockedCourseRepo.findCourse).not.toHaveBeenCalled();
    expect(mockedSyllabusRepo.publishSyllabus).not.toHaveBeenCalled();
  });

  test('should skip files that are not in the inbox folder', async () => {
    // Arrange
    const object = {
      name: 'syllabi/AST2002_Spring2017_Anderson.pdf',
      bucket: 'syllabank.appspot.com',
      contentType: 'application/pdf',
      metageneration: 0,
      timeCreated: new Date(),
      updated: new Date(),
    };
    const wrapped = testEnv.wrap(registerSyllabi);

    // Act
    await wrapped(object);

    // Assert
    expect(mockedCourseRepo.findCourse).not.toHaveBeenCalled();
    expect(mockedSyllabusRepo.publishSyllabus).not.toHaveBeenCalled();
  });

  test('should skip files that dont match syllabus pattern', async () => {
    // Arrange
    const object = {
      name: 'syllabi/AST2002_Spring2017.pdf',
      bucket: 'syllabank.appspot.com',
      contentType: 'application/pdf',
      metageneration: 0,
      timeCreated: new Date(),
      updated: new Date(),
    };
    const wrapped = testEnv.wrap(registerSyllabi);

    // Act
    await wrapped(object);

    // Assert
    expect(mockedCourseRepo.findCourse).not.toHaveBeenCalled();
    expect(mockedSyllabusRepo.publishSyllabus).not.toHaveBeenCalled();
  });

  test('should assign syllabus to matching courses', async () => {
    // Arrange
    const object = {
      name: 'inbox/AST2002_Spring2017_Anderson.pdf',
      bucket: 'syllabank.appspot.com',
      contentType: 'application/pdf',
      metageneration: 0,
      timeCreated: new Date(),
      updated: new Date(),
    };

    mockedCourseRepo.findCourse.mockResolvedValueOnce({
      name: 'AST2002',
      sections: [
        {
          term: 'Spring 2017',
          title: 'Basic Astronomy',
          last_name: 'Anderson',
          days: 'MW',
          time_begin: '1050',
          time_end: '1250',
        },
      ],
    });

    const wrapped = testEnv.wrap(registerSyllabi);

    // Act
    await wrapped(object);

    // Assert
    expect(mocked(console.error)).not.toHaveBeenCalled();
    expect(mockedCourseRepo.findCourse).toHaveBeenCalled();
    expect(mockedSyllabusRepo.publishSyllabus).toHaveBeenCalledWith(
      'syllabank.appspot.com',
      'inbox/AST2002_Spring2017_Anderson.pdf',
    );
    expect(mockedCourseRepo.saveCourse).toHaveBeenCalledWith({
      name: 'AST2002',
      sections: [
        {
          term: 'Spring 2017',
          title: 'Basic Astronomy',
          last_name: 'Anderson',
          days: 'MW',
          time_begin: '1050',
          time_end: '1250',
          syllabus: 'syllabi/AST2002_Spring2017_Anderson.pdf',
        },
      ],
    });
  });

  test('should not publish changes if no courses match', async () => {
    // Arrange
    const object = {
      name: 'inbox/AST2002_Fall2019_Anderson.pdf',
      bucket: 'syllabank.appspot.com',
      contentType: 'application/pdf',
      metageneration: 0,
      timeCreated: new Date(),
      updated: new Date(),
    };

    mockedCourseRepo.findCourse.mockResolvedValueOnce({
      name: 'AST2002',
      sections: [
        {
          term: 'Spring 2017',
          title: 'Basic Astronomy',
          last_name: 'Anderson',
          days: 'MW',
          time_begin: '1050',
          time_end: '1250',
        },
      ],
    });

    const wrapped = testEnv.wrap(registerSyllabi);

    // Act
    await wrapped(object);

    // Assert
    expect(mocked(console.error)).not.toHaveBeenCalled();
    expect(mockedCourseRepo.findCourse).toHaveBeenCalled();
    expect(mockedSyllabusRepo.publishSyllabus).not.toHaveBeenCalled();
    expect(mockedCourseRepo.saveCourse).not.toHaveBeenCalled();
  });
});
