import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './entities/personal.entity';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal)
    private readonly personalRepository: Repository<Personal>,
  ) {}

  async create(createPersonalDto: CreatePersonalDto): Promise<Personal> {
    const nuevoPersonal = this.personalRepository.create(createPersonalDto);
    return await this.personalRepository.save(nuevoPersonal);
  }

  async findAll(): Promise<Personal[]> {
    return await this.personalRepository.find();
  }

  async findOne(id: number): Promise<Personal> {
    const personal = await this.personalRepository.findOne({ where: { id_persona: id } });
    if (!personal) {
      throw new NotFoundException(`Personal con ID ${id} no encontrado`);
    }
    return personal;
  }

  async update(id: number, updatePersonalDto: UpdatePersonalDto): Promise<Personal> {
    const personal = await this.findOne(id);
    Object.assign(personal, updatePersonalDto);
    return await this.personalRepository.save(personal);
  }

  async remove(id: number): Promise<void> {
    const personal = await this.findOne(id);
    await this.personalRepository.remove(personal);
  }
}
