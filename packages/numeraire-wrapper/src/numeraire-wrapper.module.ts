import { Module } from '@nestjs/common';
import { NumeraireService } from './numeraire.service';

@Module({
  providers: [NumeraireService],
  exports: [NumeraireService]
})
export class NumeraireWrapperModule {}
