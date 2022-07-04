const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle staging test", function () {
          let raffle, raffleEntranceFee, deployer
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              console.log(deployer.address)
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })
          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and ChainLink VRF,we get a random winner", async function () {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  let winnerStartingBalance

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              console.log(`Winner ending balance:${winnerEndingBalance}`)
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      winnerStartingBalance = await accounts[0].getBalance()
                      console.log(`Winner starting balance:${winnerStartingBalance}`)
                  })
              })
          })
      })
