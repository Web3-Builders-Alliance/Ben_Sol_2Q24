use crate::state::Global;
use anchor_lang::prelude::*;
use std::collections::BTreeMap;

#[derive(Accounts)]
pub struct GlobalC<'info> {
    // house
    #[account(mut)]
    pub house: Signer<'info>,

    // global
    #[account(init_if_needed, payer = house, seeds = [b"global", house.key().as_ref()], space = Global::LEN, bump)]
    pub global: Box<Account<'info, Global>>,

    // system program
    pub system_program: Program<'info, System>,
}

impl<'info> GlobalC<'info> {
    pub fn init(&mut self, bumps: &BTreeMap<String, u8>,) -> Result<()> {
        self.global.set_inner( Global {
            round: 1,
            number: 50,
            bump: *bumps.get("global").unwrap(),
        });
        Ok(())
    }
}