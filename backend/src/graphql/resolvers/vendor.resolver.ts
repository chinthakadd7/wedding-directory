import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VendorModel } from '../models/vendor.model';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { VendorService } from '../../modules/vendor/vendor.service';
import { CreateVendorInput } from '../inputs/createVendor.input';
import { UpdateVendorInput } from '../inputs/updateVendor.input';

@Resolver(() => VendorModel)
export class VendorResolver {
  constructor(private readonly vendorService: VendorService) {}

  @Query(() => VendorModel)
  async findVendorById(
    @Args('id', { type: () => String }) id: string,
  ): Promise<VendorEntity> {
    return this.vendorService.findVendorById(id);
  }

  @Query(() => [VendorModel])
  async findAllVendors(): Promise<VendorEntity[]> {
    return this.vendorService.findAllVendors();
  }

  @Query(() => VendorModel, { nullable: true })
  async findVendorByEmail(
    @Args('email', { type: () => String }) email: string,
  ): Promise<VendorEntity | null> {
    const vendor = await this.vendorService.getVendorByEmail(email);
    return vendor || null;
  }

  @Query(() => VendorModel, { nullable: true })
  async findVendorBySlug(
    @Args('slug', { type: () => String }) slug: string,
  ): Promise<VendorEntity | null> {
    return this.vendorService.findVendorBySlug(slug);
  }

  @Query(() => [String])
  async autocompleteLocation(@Args('input') input: string): Promise<string[]> {
    return this.vendorService.autocompleteLocation(input);
  }

  @Mutation(() => VendorModel)
  async createVendor(
    @Args('input') input: CreateVendorInput,
  ): Promise<VendorEntity> {
    return this.vendorService.createVendor(input);
  }

  @Mutation(() => VendorModel)
  async updateVendor(
    @Args('id') id: string,
    @Args('input') input: UpdateVendorInput,
  ): Promise<VendorEntity> {
    return this.vendorService.updateVendor(id, input);
  }

  @Mutation(() => Boolean)
  async deleteVendor(@Args('id') id: string): Promise<boolean> {
    try {
      await this.vendorService.deleteVendor(id);
      return true;
    } catch (error) {
      throw new Error(error.message || 'Error deleting vendor');
    }
  }

  @Mutation(() => VendorModel)
  async updateVendorProfilePic(
    @Args('id') id: string,
    @Args('fileUrl') fileUrl: string,
  ): Promise<VendorEntity> {
    return this.vendorService.updateVendorProfilePic(id, fileUrl);
  }

  @Query(() => [VendorModel])
  async findVendorsByService(
    @Args('service_id') serviceId: string,
  ): Promise<VendorEntity[]> {
    return this.vendorService.findVendorsByService(serviceId);
  }

  @Mutation(() => Boolean)
  async registerVendorPushToken(
    @Args('vendorId') vendorId: string,
    @Args('pushToken') pushToken: string,
  ): Promise<boolean> {
    await this.vendorService.registerPushToken(vendorId, pushToken);
    return true;
  }

  /** One-time mutation: backfill slugs for all vendors that have none. Returns count updated. */
  @Mutation(() => Number)
  async backfillVendorSlugs(): Promise<number> {
    return this.vendorService.backfillVendorSlugs();
  }
}
