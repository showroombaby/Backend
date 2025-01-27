import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRating } from '../entities/user-rating.entity';
import { User } from '../entities/user.entity';
import { CreateRatingDto } from '../dto/create-rating.dto';

@Injectable()
export class UserRatingsService {
  constructor(
    @InjectRepository(UserRating)
    private readonly userRatingRepository: Repository<UserRating>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createRating(
    raterId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<UserRating> {
    // Vérifier que l'utilisateur à noter existe
    const ratedUser = await this.userRepository.findOne({
      where: { id: createRatingDto.userId },
    });
    if (!ratedUser) {
      throw new NotFoundException('User to rate not found');
    }

    // Vérifier que l'utilisateur ne se note pas lui-même
    if (raterId === createRatingDto.userId) {
      throw new ConflictException('You cannot rate yourself');
    }

    // Vérifier si une note existe déjà
    const existingRating = await this.userRatingRepository.findOne({
      where: {
        rater_id: raterId,
        rated_id: createRatingDto.userId,
      },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this user');
    }

    // Créer la nouvelle note
    const rating = this.userRatingRepository.create({
      rating: createRatingDto.rating,
      comment: createRatingDto.comment,
      rater_id: raterId,
      rated_id: createRatingDto.userId,
    });

    // Sauvegarder la note
    await this.userRatingRepository.save(rating);

    // Mettre à jour la note moyenne de l'utilisateur
    await this.updateUserAverageRating(createRatingDto.userId);

    return rating;
  }

  private async updateUserAverageRating(userId: string): Promise<void> {
    const result = await this.userRatingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'averageRating')
      .where('rating.rated_id = :userId', { userId })
      .getRawOne();

    await this.userRepository.update(
      { id: userId },
      { rating: result.averageRating || 0 },
    );
  }

  async getUserRatings(userId: string): Promise<UserRating[]> {
    return this.userRatingRepository.find({
      where: { rated_id: userId },
      relations: ['rater'],
      order: { createdAt: 'DESC' },
    });
  }
}
