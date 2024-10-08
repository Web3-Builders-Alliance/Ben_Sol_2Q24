use crate::state::Global;
use anchor_lang::prelude::*;
use std::collections::BTreeMap;

#[derive(Accounts)]
pub struct GlobalC<'info> {
    #[account(mut)]
    pub house: Signer<'info>,

    // global
    #[account(init, payer = house, seeds = [b"global", house.key().as_ref()], space = Global::LEN, bump)]
    pub global: Account<'info, Global>,

    // system program
    pub system_program: Program<'info, System>,
}

impl<'info> GlobalC<'info> {
    pub fn init(&mut self, bumps: &BTreeMap<String, u8>,) -> Result<()> {
        self.global.set_inner( Global {
            house: self.house.key(),
            round: 1,
            number: 50,
            bump: *bumps.get("global").unwrap(),
        });

        msg!("global house: {}", self.global.house.to_string());
        msg!("global init round: {}", self.global.round.to_string());
        msg!("global init number: {}", self.global.house.to_string());

        Ok(())
    }
}