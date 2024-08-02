import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { BadRequestException } from '@nestjs/common';
import { INote } from './interfaces/note.interface';

describe('NotesService', () => {
  let service: NotesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: PrismaService,
          useValue: {
            note: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  const userId = 'user1';
  const noteId = 'note1';
  const noteDto: CreateNoteDto = { title: 'Test Note', content: 'Test Content' };
  const note: INote = {
      id: noteId, ...noteDto, userId,
      createdAt: undefined,
      updatedAt: undefined
  };

  describe('createNote', () => {
    it('should throw error if note with title already exists', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(note);

      await expect(service.createNote(noteDto, userId)).rejects.toThrow(
        new BadRequestException({
          message: `Note with title '${noteDto.title}' already exists.`,
        }),
      );
    });

    it('should create a new note and return it', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.note, 'create').mockResolvedValue(note);

      const result = await service.createNote(noteDto, userId);
      expect(result).toEqual(note);
    });
  });

  describe('getNotes', () => {
    it('should return all notes', async () => {
      jest.spyOn(prismaService.note, 'findMany').mockResolvedValue([note]);

      const result = await service.getNotes();
      expect(result).toEqual([note]);
    });
  });

  describe('getNote', () => {
    it('should throw error if note not found', async () => {
      jest.spyOn(prismaService.note, 'findFirst').mockResolvedValue(null);

      await expect(service.getNote(noteId, userId)).rejects.toThrow(
        new BadRequestException({ message: 'Note not found' }),
      );
    });

    it('should return the note if found', async () => {
      jest.spyOn(prismaService.note, 'findFirst').mockResolvedValue(note);

      const result = await service.getNote(noteId, userId);
      expect(result).toEqual(note);
    });
  });

  describe('updateNote', () => {
    it('should throw error if note not found', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);

      await expect(service.updateNote(noteDto, noteId, userId)).rejects.toThrow(
        new BadRequestException({
          message: `Note with id '${noteId}' not found.`,
        }),
      );
    });

    it('should update and return the note', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(note);
      jest.spyOn(prismaService.note, 'update').mockResolvedValue(note);

      const result = await service.updateNote(noteDto, noteId, userId);
      expect(result).toEqual(note);
    });
  });

  describe('deleteNote', () => {
    it('should throw error if note not found', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);

      await expect(service.deleteNote(noteId, userId)).rejects.toThrow(
        new BadRequestException({
          message: `Note with id '${noteId}' not found.`,
        }),
      );
    });

    it('should delete and return the note', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(note);
      jest.spyOn(prismaService.note, 'delete').mockResolvedValue(note);

      const result = await service.deleteNote(noteId, userId);
      expect(result).toEqual(note);
    });
  });
});
